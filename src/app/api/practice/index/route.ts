import { NextRequest, NextResponse } from 'next/server';
import { indexDocument, checkIfIndexed } from "@/lib/google/embeddings";

export async function POST(req: NextRequest) {
  try {
    const { noteId, courseId, content, force = false } = await req.json();

    if (!noteId && !courseId) {
      return NextResponse.json({ error: "Either noteId or courseId is required." }, { status: 400 });
    }

    // 1. RELAXED CACHING: Check if we already have index for this note or course
    if (!force) {
      const status = await checkIfIndexed(courseId, noteId);
      
      if (status.indexed) {
        console.log(`📡 [Smart Cache] Skipping indexing for ${noteId ? "Note" : "Course"}: Already present in DB.`);
        return NextResponse.json({ 
          success: true, 
          message: "Already indexed.", 
          alreadyIndexed: true
        });
      }
    }

    // 2. Perform indexing
    if (!content) {
      return NextResponse.json({ error: "Content is required for indexing." }, { status: 400 });
    }

    const result = await indexDocument(content, noteId, courseId);

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

// Optional: GET to check status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');

  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const status = await checkIfIndexed(undefined, noteId);
  return NextResponse.json({ 
    isIndexed: status.indexed
  });
}
