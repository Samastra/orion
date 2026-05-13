import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/lecture/transcribe
 * 
 * Accepts an audio blob from the client and sends it to Deepgram's
 * pre-recorded API for transcription. Returns transcript segments
 * with timestamps.
 * 
 * AUTH NOTE: No auth check here. This endpoint is called every ~5s
 * during recording, and heavy auth calls cause Supabase timeouts.
 * The middleware already protects /dashboard/* pages (so only logged-in
 * users can reach the recorder UI), and the transform route (which
 * saves data & deducts shards) has full supabase.auth.getUser() checks.
 * This route is a stateless Deepgram proxy — no user data is accessed.
 */
export async function POST(req: NextRequest) {
  try {

    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) {
      console.error('❌ [Lecture/Transcribe] DEEPGRAM_API_KEY not configured');
      return NextResponse.json({ error: 'Transcription service not configured' }, { status: 500 });
    }

    // ─── RECEIVE AUDIO ────────────────────────────────────────
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // ─── SEND TO DEEPGRAM PRE-RECORDED API ────────────────────
    const deepgramResponse = await fetch(
      'https://api.deepgram.com/v1/listen?' + new URLSearchParams({
        model: 'nova-3',
        smart_format: 'true',
        punctuate: 'true',
        utterances: 'true',
        utterance_end_ms: '1500',
      }),
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': 'audio/webm',
        },
        body: audioBuffer,
      }
    );

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text();
      console.error('❌ [Lecture/Transcribe] Deepgram API error:', deepgramResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Transcription failed',
        details: `Deepgram returned ${deepgramResponse.status}` 
      }, { status: 502 });
    }

    const result = await deepgramResponse.json();

    // ─── EXTRACT SEGMENTS ─────────────────────────────────────
    const segments: Array<{
      text: string;
      start: number;
      end: number;
      is_final: boolean;
    }> = [];

    // Use utterances if available (more natural sentence grouping)
    if (result.results?.utterances) {
      for (const utterance of result.results.utterances) {
        if (utterance.transcript.trim()) {
          segments.push({
            text: utterance.transcript.trim(),
            start: utterance.start,
            end: utterance.end,
            is_final: true,
          });
        }
      }
    } 
    // Fallback to channel alternatives
    else if (result.results?.channels?.[0]?.alternatives?.[0]) {
      const alt = result.results.channels[0].alternatives[0];
      if (alt.transcript?.trim()) {
        segments.push({
          text: alt.transcript.trim(),
          start: 0,
          end: result.metadata?.duration || 0,
          is_final: true,
        });
      }
    }

    return NextResponse.json({ 
      segments,
      duration: result.metadata?.duration || 0,
    });

  } catch (error) {
    console.error('❌ [Lecture/Transcribe] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
