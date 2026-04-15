import { NextRequest, NextResponse } from 'next/server';
import { indexDocument, checkIfIndexed } from "@/lib/google/embeddings";
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { noteId, courseId, content, force = false } = await req.json();

    if (!noteId && !courseId) {
      return NextResponse.json({ error: "Either noteId or courseId is required." }, { status: 400 });
    }

    // Get the authenticated user's ID for RLS
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Session expired or invalid. Please log in again to sync practice data.", 
        details: authError?.message 
      }, { status: 401 });
    }
    
    const userId = user.id;

    // SCENARIO 1: We are indexing a SPECIFIC note
    if (noteId) {
      if (!force) {
        const { indexed } = await checkIfIndexed(undefined, noteId);
        if (indexed) {
          console.log(`📡 [Cache] Note ${noteId} already indexed. Skipping.`);
          return NextResponse.json({ success: true, alreadyIndexed: true });
        }
      }

      let indexingContent = content;
      if (!indexingContent) {
        const { data: note, error: fetchError } = await supabase
          .from('notes')
          .select('content')
          .eq('id', noteId)
          .single();
        if (fetchError || !note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
        indexingContent = note.content;
      }

      const result = await indexDocument(indexingContent, noteId, courseId, userId);
      return NextResponse.json({ success: true, chunksCount: result.chunksCount });
    }

    // SCENARIO 2: We are syncing a whole COURSE
    if (courseId && !noteId) {
      console.log(`📡 [Indexer] Syncing course: ${courseId}`);
      const { data: notes, error: fetchError } = await supabase
        .from('notes')
        .select('id, content')
        .eq('course_id', courseId);

      if (fetchError || !notes) return NextResponse.json({ error: "Could not fetch course notes" }, { status: 500 });
      
      let totalChunks = 0;
      for (const note of notes) {
        const { indexed } = await checkIfIndexed(undefined, note.id);
        if (!indexed || force) {
          console.log(`📡 [Indexer] Missing embeddings for note ${note.id}. Processing...`);
          const res = await indexDocument(note.content, note.id, courseId, userId);
          totalChunks += res.chunksCount;
        }
      }

      return NextResponse.json({ success: true, chunksCount: totalChunks, notesProcessed: notes.length });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("Indexing API error:", error);
    return NextResponse.json({ 
      error: "Internal server error during indexing.",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');

  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const status = await checkIfIndexed(undefined, noteId);
  return NextResponse.json({ indexed: status.indexed });
}
