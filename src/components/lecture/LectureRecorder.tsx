'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Pause, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SHARD_COSTS } from '@/constants/shards';
import { ShardIcon } from '@/components/shards/ShardIcon';
import { WaveformVisualizer } from './WaveformVisualizer';
import { LiveTranscript, TranscriptSegment } from './LiveTranscript';
import { toast } from 'sonner';

/**
 * LECTURE RECORDER
 * 
 * Core recording component that manages:
 * - MediaRecorder lifecycle using stop/restart cycles for valid audio chunks
 * - Web Audio API AnalyserNode for waveform visualization
 * - Sending complete audio files to /api/lecture/transcribe
 * - Accumulating transcript segments with timestamps
 * - Live shard cost estimation
 * 
 * ARCHITECTURE NOTE:
 * We use a "stop/restart" pattern instead of timeslice chunking.
 * Every ~5 seconds, we stop the MediaRecorder (producing a complete, valid
 * WebM file with headers), send it to Deepgram, then immediately start a
 * new MediaRecorder on the same mic stream. The stream never stops, so
 * the gap is sub-millisecond and imperceptible.
 */

interface LectureRecorderProps {
  courseId: string;
  courseName: string;
  onRecordingComplete: (transcript: string, durationSeconds: number) => void;
  onCancel: () => void;
}

const CHUNK_INTERVAL_MS = 5000; // Send audio every 5 seconds

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function LectureRecorder({ courseId, courseName, onRecordingComplete, onCancel }: LectureRecorderProps) {
  // ─── STATE ────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // ─── REFS ─────────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentIdRef = useRef(0);
  const elapsedRef = useRef(0); // Mirror of elapsedSeconds for use in callbacks
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const isStopping = useRef(false); // True when user clicked "Done"
  const currentRecorderRef = useRef<MediaRecorder | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);
  const segmentsRef = useRef<TranscriptSegment[]>([]); // Mirror of segments state for async access

  // ─── SHARD COST ESTIMATION ────────────────────────────────────
  const estimatedRecordingCost = Math.ceil(elapsedSeconds / 60) * SHARD_COSTS.lecture_recording_per_minute;
  const estimatedTotalCost = estimatedRecordingCost + SHARD_COSTS.lecture_transform;

  // Keep refs in sync with state
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // ─── SEND AUDIO TO DEEPGRAM ───────────────────────────────────
  const sendAudioBlob = useCallback(async (audioBlob: Blob) => {
    // Don't send tiny blobs (< 2KB = likely silence or empty)
    if (audioBlob.size < 2048) return;

    setIsProcessingChunk(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'chunk.webm');

      const response = await fetch('/api/lecture/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ [Recorder] Transcription chunk failed:', response.status, errorData);
        toast.error(errorData.message || 'Failed to process audio chunk. Please check your connection.');
        return;
      }

      const data = await response.json();

      if (data.segments && data.segments.length > 0) {
        setInterimText('');
        const currentElapsed = elapsedRef.current;
        const newSegments: TranscriptSegment[] = data.segments.map((seg: any) => ({
          id: `seg-${++segmentIdRef.current}`,
          text: seg.text,
          start: seg.start,
          end: seg.end,
          isFinal: seg.is_final,
          timestamp: formatTimestamp(currentElapsed),
        }));
        setSegments(prev => {
          const updated = [...prev, ...newSegments];
          segmentsRef.current = updated;
          return updated;
        });
      }
    } catch (err) {
      console.warn('⚠️ [Recorder] Chunk send error:', err);
      toast.error('Network error while processing audio chunk.');
    } finally {
      setIsProcessingChunk(false);
    }
  }, []);

  // ─── CREATE & START A NEW MEDIA RECORDER ──────────────────────
  const createAndStartRecorder = useCallback((stream: MediaStream): MediaRecorder => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    // When the recorder is stopped, it fires ondataavailable with a complete file
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        pendingBlobRef.current = event.data;
      }
    };

    recorder.onstop = () => {
      const blob = pendingBlobRef.current;
      pendingBlobRef.current = null;

      if (blob) {
        sendAudioBlob(blob);
      }

      // If this stop was triggered by the cycle interval (not the user hitting Done),
      // immediately start a new recorder on the same stream
      if (!isStopping.current && isRecordingRef.current && !isPausedRef.current && streamRef.current) {
        const newRecorder = createAndStartRecorder(streamRef.current);
        currentRecorderRef.current = newRecorder;
      }
    };

    recorder.start(); // No timeslice — records until stop() is called
    return recorder;
  }, [sendAudioBlob]);

  // ─── CYCLE: STOP CURRENT RECORDER TO FLUSH AUDIO ──────────────
  const cycleRecorder = useCallback(() => {
    const recorder = currentRecorderRef.current;
    if (!recorder || recorder.state === 'inactive' || isPausedRef.current) return;

    // Stop the current recorder — this triggers ondataavailable + onstop
    // onstop will automatically create a new recorder
    recorder.stop();
  }, []);

  // ─── START RECORDING ──────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setMicPermissionDenied(false);
      isStopping.current = false;

      // Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      streamRef.current = stream;

      // Set up Web Audio API for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start the first MediaRecorder
      const recorder = createAndStartRecorder(stream);
      currentRecorderRef.current = recorder;

      setIsRecording(true);
      setIsPaused(false);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Start the cycle interval — every 5 seconds, stop & restart the recorder
      cycleIntervalRef.current = setInterval(() => {
        cycleRecorder();
      }, CHUNK_INTERVAL_MS);

    } catch (err: any) {
      console.error('❌ [Recorder] Failed to start:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
      } else {
        setError('Failed to access microphone. Please check your browser permissions.');
        toast.error('Microphone access failed');
      }
    }
  }, [createAndStartRecorder, cycleRecorder]);

  // ─── PAUSE / RESUME ──────────────────────────────────────────
  const togglePause = useCallback(() => {
    const recorder = currentRecorderRef.current;
    if (!recorder || !streamRef.current) return;

    if (isPaused) {
      // RESUME: start a new recorder on the existing stream
      const newRecorder = createAndStartRecorder(streamRef.current);
      currentRecorderRef.current = newRecorder;
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Resume cycle
      cycleIntervalRef.current = setInterval(() => {
        cycleRecorder();
      }, CHUNK_INTERVAL_MS);
    } else {
      // PAUSE: stop current recorder (sends remaining audio), don't restart
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);

      // Stop recorder to send any buffered audio
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }
  }, [isPaused, createAndStartRecorder, cycleRecorder]);

  // ─── STOP / DONE ─────────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    // Signal that we're stopping — prevents onstop from creating a new recorder
    isStopping.current = true;

    // Stop timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);

    // Stop current recorder (sends last audio chunk)
    const recorder = currentRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    // Give a moment for the last onstop/send to fire
    await new Promise(resolve => setTimeout(resolve, 500));

    // Stop mic stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    // Close audio context safely
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
    } catch (e) {
      // Already closed, ignore
    }
    audioContextRef.current = null;

    setIsRecording(false);
    setIsPaused(false);

    // Compile transcript from the ref (avoids setState-during-render)
    const fullTranscript = segmentsRef.current.map(s => s.text).join(' ');
    // Defer parent callback to next tick to avoid updating parent while rendering child
    setTimeout(() => {
      onRecordingComplete(fullTranscript, elapsedRef.current);
    }, 0);
  }, [onRecordingComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStopping.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);

      const recorder = currentRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }

      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;

      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) { /* ignore */ }
    };
  }, []);

  // ─── MIC PERMISSION DENIED STATE ──────────────────────────────
  if (micPermissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <MicOff className="w-10 h-10 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Microphone Access Required</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Please allow microphone access in your browser settings to use the Note Taker.
        </p>
        <button
          onClick={onCancel}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          ← Go back to course selection
        </button>
      </div>
    );
  }

  // ─── PRE-RECORDING STATE (Start Button) ───────────────────────
  if (!isRecording && segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        {/* Course badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{courseName}</span>
        </div>

        {/* Visualizer (idle) */}
        <div className="w-64 h-64 lg:w-80 lg:h-80 mb-8">
          <WaveformVisualizer
            analyserNode={null}
            isRecording={false}
            isPaused={false}
            className="w-full h-full"
          />
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startRecording}
          className="flex items-center gap-3 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
        >
          <Mic className="w-5 h-5" />
          Start Recording
        </motion.button>

        <p className="text-[11px] text-muted-foreground/40 mt-4 flex items-center gap-1.5">
          <ShardIcon size={12} />
          {SHARD_COSTS.lecture_recording_per_minute} shards/min recording + {SHARD_COSTS.lecture_transform} shards for AI notes
        </p>

        {error && (
          <p className="text-sm text-rose-400 mt-4">{error}</p>
        )}
      </div>
    );
  }

  // ─── ACTIVE RECORDING STATE ───────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-[70vh]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        {/* Course badge */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isPaused ? "bg-amber-400" : "bg-red-500 animate-pulse"
          )} />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[200px]">
            {courseName}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono font-bold tabular-nums text-white/80">
            {formatTime(elapsedSeconds)}
          </span>
          {/* Shard cost estimate */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <ShardIcon size={12} />
            <span className="text-[11px] font-bold tabular-nums text-white/60">
              ~{estimatedTotalCost}
            </span>
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <div className="flex-shrink-0 flex items-center justify-center py-4 lg:py-6">
        <div className="w-48 h-48 lg:w-64 lg:h-64">
          <WaveformVisualizer
            analyserNode={analyserRef.current}
            isRecording={isRecording}
            isPaused={isPaused}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 min-h-0 border-t border-white/5 bg-white/[0.01] rounded-t-2xl overflow-hidden">
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Live Transcript</span>
          {isProcessingChunk && (
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400/60">
              <Loader2 className="w-3 h-3 animate-spin" />
              processing...
            </div>
          )}
        </div>
        <LiveTranscript
          segments={segments}
          interimText={interimText}
          isRecording={isRecording}
          isPaused={isPaused}
          elapsedSeconds={elapsedSeconds}
          className="h-[calc(100%-32px)]"
        />
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-6 px-4 py-5 border-t border-white/5 bg-background">
        {/* Pause/Resume */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePause}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all border",
            isPaused
              ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30"
              : "bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25"
          )}
        >
          {isPaused ? <Play className="w-6 h-6 ml-0.5" /> : <Pause className="w-6 h-6" />}
        </motion.button>

        {/* Done / Stop */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 hover:bg-rose-600/30 transition-all"
        >
          <Square className="w-6 h-6 fill-current" />
        </motion.button>
      </div>
    </div>
  );
}
