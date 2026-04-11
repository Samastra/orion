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

    // Check cache (skip re-indexing unless forced)
    if (!force) {
      const status = await checkIfIndexed(courseId, noteId);
      
      if (status.indexed) {
        console.log(`📡 [Cache] Already indexed for ${noteId ? "Note" : "Course"}. Skipping.`);
        return NextResponse.json({ 
          success: true, 
          message: "Already indexed.", 
          alreadyIndexed: true
        });
      }
    }

    let indexingContent = content;

    // AUTO-FETCH CONTENT: If missing, grab from DB
    if (!indexingContent && noteId) {
      console.log(`📡 [Indexer] No content provided. Fetching from DB for note: ${noteId}`);
      const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();
      
      if (fetchError || !note) {
        return NextResponse.json({ error: "Could not find note content in database." }, { status: 404 });
      }
      indexingContent = note.content;
    }

    if (!indexingContent) {
      return NextResponse.json({ error: "Content is required for indexing." }, { status: 400 });
    }

    const result = await indexDocument(indexingContent, noteId, courseId, userId);

    return NextResponse.json({ 
      success: true, 
      message: "Indexing complete.", 
      chunksCount: result.chunksCount 
    });
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
  return NextResponse.json({ isIndexed: status.indexed });
}
