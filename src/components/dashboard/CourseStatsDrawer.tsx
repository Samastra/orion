'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StylizedDonutChart, DonutStatsLegend } from './StylizedDonutChart';
import Link from 'next/link';

interface CourseStatsDrawerProps {
  course: any | null;
  score: number;
  totalQuestions: number;
  onClose: () => void;
}

export function CourseStatsDrawer({ course, score, totalQuestions, onClose }: CourseStatsDrawerProps) {
  if (!course) return null;

  return (
    <AnimatePresence>
      {course && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[#0D0D12] border-t border-white/[0.08] rounded-t-[40px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                   <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{course.name}</h2>
                  <p className="text-[12px] text-muted-foreground/40 font-medium uppercase tracking-widest">{course.type}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-muted-foreground/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-12 pt-4 scrollbar-hide">
              <div className="space-y-10">
                {/* The Main Chart */}
                <div className="py-2">
                    <StylizedDonutChart score={score} totalQuestions={totalQuestions} />
                </div>

                {/* Detailed Legend */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Progress Breakdown</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-bold">
                         Avg Index <Trophy className="w-3 h-3" />
                      </div>
                   </div>
                   <DonutStatsLegend score={score} totalQuestions={totalQuestions} />
                </div>

                {/* Navigation Link (Optional but helpful) */}
                <div className="pt-4">
                   <Link href={`/dashboard/courses/${course.id}`} onClick={onClose}>
                      <Button className="w-full h-14 rounded-3xl bg-white/[0.03] border border-white/[0.08] text-white font-bold text-[14px] flex items-center justify-between px-6 hover:bg-white/[0.05] transition-all group">
                         <span>Go to Academic Workspace</span>
                         <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                   </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
