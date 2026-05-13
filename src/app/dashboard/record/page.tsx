'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Loader2, Check, Mic, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useShards } from '@/components/shards/ShardBalanceProvider';
import { ShardIcon } from '@/components/shards/ShardIcon';
import { LectureRecorder } from '@/components/lecture/LectureRecorder';
import { calculateLectureCost, SHARD_COSTS } from '@/constants/shards';

/**
 * NOTE TAKER PAGE
 * 
 * Three states:
 * 1. Course Selection — Pick a course to record for
 * 2. Recording — Immersive recording with live transcript
 * 3. Processing — Review transcript & transform to study notes
 */

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
}

type PageState = 'select' | 'recording' | 'processing';

export default function RecordPage() {
  const router = useRouter();
  const { balance, refreshBalance } = useShards();

  // ─── STATE ────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>('select');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [transcript, setTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);

  // ─── FETCH COURSES ────────────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('courses')
        .select('id, name, type, description')
        .order('created_at', { ascending: false });

      if (!error && data) setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // ─── HANDLERS ─────────────────────────────────────────────────
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setPageState('recording');
  };

  const handleRecordingComplete = (fullTranscript: string, duration: number) => {
    setTranscript(fullTranscript);
    setDurationSeconds(duration);
    setPageState('processing');
  };

  const handleTransform = async () => {
    if (!selectedCourse || !transcript.trim()) return;

    setIsTransforming(true);
    setTransformError(null);

    try {
      const response = await fetch('/api/lecture/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          courseId: selectedCourse.id,
          durationSeconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'INSUFFICIENT_SHARDS') {
          setTransformError(`Not enough shards! You need ${data.required} but only have ${data.balance}.`);
        } else {
          setTransformError(data.error || 'Transformation failed. Please try again.');
        }
        return;
      }

      // Refresh shard balance
      await refreshBalance();

      // Navigate to the new note
      router.push(`/dashboard/courses/${selectedCourse.id}`);

    } catch (err) {
      setTransformError('Network error. Please check your connection and try again.');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleBackToSelect = () => {
    setPageState('select');
    setSelectedCourse(null);
    setTranscript('');
    setDurationSeconds(0);
    setTransformError(null);
  };

  // ─── COST CALCULATION ─────────────────────────────────────────
  const lectureCost = durationSeconds > 0 ? calculateLectureCost(durationSeconds) : null;

  // ═══════════════════════════════════════════════════════════════
  // STATE 1: COURSE SELECTION
  // ═══════════════════════════════════════════════════════════════
  if (pageState === 'select') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Back to dashboard */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
          Home
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Note Taker</h1>
              <p className="text-sm text-muted-foreground/60">Record a lecture and let AI transform it into study notes</p>
            </div>
          </div>
        </div>

        {/* Cost info banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
          <ShardIcon size={16} />
          <p className="text-[12px] text-muted-foreground/60">
            <span className="font-bold text-white/70">{SHARD_COSTS.lecture_recording_per_minute} shards/min</span> recording + <span className="font-bold text-white/70">{SHARD_COSTS.lecture_transform} shards</span> for AI note generation
          </p>
        </div>

        {/* Course Selection */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest ml-1">Select a course</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {courses.map((course, index) => (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleCourseSelect(course)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all group text-left"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] group-hover:text-indigo-400 transition-colors truncate">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold truncate">
                          {course.type}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-indigo-400 transition-colors" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No courses yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Create a course first to start recording lectures.</p>
              </div>
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                Go to Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE 2: RECORDING
  // ═══════════════════════════════════════════════════════════════
  if (pageState === 'recording' && selectedCourse) {
    return (
      <div className="max-w-3xl mx-auto">
        <LectureRecorder
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleBackToSelect}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE 3: PROCESSING (Review & Transform)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToSelect}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          New Recording
        </button>
        {selectedCourse && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{selectedCourse.name}</span>
          </div>
        )}
      </div>

      {/* Recording Summary */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Recording Complete</h2>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s recorded • {transcript.split(/\s+/).length} words
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Cost breakdown */}
        {lectureCost && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
            <ShardIcon size={16} />
            <div className="flex-1 text-[12px] text-muted-foreground/60 space-y-0.5">
              <div className="flex justify-between">
                <span>Recording ({Math.ceil(durationSeconds / 60)} min × {SHARD_COSTS.lecture_recording_per_minute})</span>
                <span className="font-bold text-white/70">{lectureCost.recordingCost}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Note Generation</span>
                <span className="font-bold text-white/70">{lectureCost.transformCost}</span>
              </div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-white/5">
                <span className="font-bold text-white/50">Total</span>
                <span className="font-bold text-white/90">{lectureCost.totalCost} shards</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript preview */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Transcript Preview</span>
        </div>
        <div className="px-5 py-4 max-h-64 overflow-y-auto">
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
            {transcript || 'No transcript captured. Try recording again.'}
          </p>
        </div>
      </div>

      {/* Transform Button */}
      {transcript.trim() ? (
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleTransform}
            disabled={isTransforming}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-bold text-sm transition-all",
              isTransforming
                ? "bg-indigo-600/50 text-white/70 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
            )}
          >
            {isTransforming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Study Notes...
              </>
            ) : (
              <>
                Create Notes
                <div className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded-lg bg-white/10 text-xs">
                  <ShardIcon size={12} />
                  {lectureCost?.totalCost || 0}
                </div>
              </>
            )}
          </motion.button>

          {/* Balance info */}
          <p className="text-center text-[11px] text-muted-foreground/30">
            Your balance: <span className="font-bold text-white/50">{balance.toLocaleString()} shards</span>
          </p>

          {transformError && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 text-center">
              {transformError}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground/50">No transcript was captured during this recording.</p>
          <button
            onClick={handleBackToSelect}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Try recording again
          </button>
        </div>
      )}
    </div>
  );
}
