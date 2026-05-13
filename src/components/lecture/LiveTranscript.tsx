'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LIVE TRANSCRIPT
 * 
 * Scrollable transcript display with:
 * - Timestamp badges per segment [HH:MM:SS]
 * - Final segments in solid text
 * - Interim segments in italic/faded with shimmer animation
 * - Auto-scroll with "scroll to bottom" button if user scrolls up
 * - Empty state with pulsing mic icon
 */

export interface TranscriptSegment {
  id: string;
  text: string;
  start: number;      // seconds from start of recording
  end: number;
  isFinal: boolean;
  timestamp: string;   // formatted HH:MM:SS
}

interface LiveTranscriptProps {
  segments: TranscriptSegment[];
  interimText: string;
  isRecording: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  className?: string;
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

export function LiveTranscript({
  segments,
  interimText,
  isRecording,
  isPaused,
  elapsedSeconds,
  className,
}: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Auto-scroll when new segments arrive
  useEffect(() => {
    if (isAutoScrolling && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments.length, interimText, isAutoScrolling]);

  // Track if user has scrolled away from bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollButton(!isAtBottom);
    setIsAutoScrolling(isAtBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAutoScrolling(true);
    setShowScrollButton(false);
  };

  // Empty state
  if (segments.length === 0 && !interimText) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
        <motion.div
          animate={{ 
            scale: isPaused ? 1 : [1, 1.15, 1],
            opacity: isPaused ? 0.3 : [0.5, 1, 0.5],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4"
        >
          <Mic className="w-7 h-7 text-indigo-400" />
        </motion.div>
        <p className="text-sm text-muted-foreground/60 font-medium">
          {isPaused ? 'Recording paused...' : isRecording ? 'Listening...' : 'Ready to record'}
        </p>
        <p className="text-[11px] text-muted-foreground/30 mt-1">
          {isRecording && !isPaused 
            ? 'Start speaking and your words will appear here' 
            : isPaused 
              ? 'Resume recording to continue' 
              : ''
          }
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col", className)}>
      {/* Transcript scrollable area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
        style={{ maxHeight: '100%' }}
      >
        <AnimatePresence initial={false}>
          {segments.map((segment) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3 items-start"
            >
              {/* Timestamp badge */}
              <span className="shrink-0 text-[10px] font-mono font-bold text-indigo-400/60 bg-indigo-500/8 px-2 py-1 rounded-md mt-0.5 tabular-nums border border-indigo-500/10">
                {segment.timestamp}
              </span>
              {/* Text */}
              <p className="text-sm text-white/90 leading-relaxed flex-1">
                {segment.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Interim (in-progress) text */}
        {interimText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <span className="shrink-0 text-[10px] font-mono font-bold text-white/20 bg-white/[0.03] px-2 py-1 rounded-md mt-0.5 tabular-nums border border-white/5">
              {formatTimestamp(elapsedSeconds)}
            </span>
            <p className="text-sm text-white/30 italic leading-relaxed flex-1 animate-pulse">
              {interimText}
            </p>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-indigo-600/80 backdrop-blur-sm text-white flex items-center justify-center shadow-lg border border-indigo-500/30 hover:bg-indigo-500 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
