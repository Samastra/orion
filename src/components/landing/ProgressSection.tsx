'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ProgressDesktopPreview } from './ProgressDesktopPreview';
import { ProgressMobilePreview } from './ProgressMobilePreview';

export function ProgressSection() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <section className="relative py-24 sm:py-32 px-6 bg-background overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4">Track Progress</p>
          <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight leading-[1.15]">
            See how well you&apos;re doing.
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground/50 leading-relaxed max-w-lg mx-auto">
            Real-time mastery tracking across all your courses. Know exactly where you stand — and where to focus next.
          </p>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="relative"
        >
          {/* Glow underneath */}
          <div className="absolute -inset-8 bg-indigo-600/[0.06] blur-[80px] rounded-3xl -z-10" />
          <div className="absolute -inset-4 bg-violet-600/[0.03] blur-[60px] rounded-3xl -z-10" />

          {/* Preview */}
          {isDesktop ? (
            <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_20px_80px_-20px_rgba(99,102,241,0.15)] bg-background">
              <ProgressDesktopPreview />
            </div>
          ) : (
            <ProgressMobilePreview />
          )}

          {/* Fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
