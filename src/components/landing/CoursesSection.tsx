'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CoursesPreview } from './CoursesPreview';
import { CoursesMobilePreview } from './CoursesMobilePreview';
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function CoursesSection() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <section className="relative py-28 px-6 bg-background overflow-hidden">
      {/* Subtle dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none">
        <defs>
          <pattern id="courses-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="currentColor" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#courses-dots)" />
      </svg>

      {/* Glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/[0.05] blur-[150px] rounded-full -z-0" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4">Organized Learning</p>
          <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.15]">
            All your coursework.
            <br />
            <span className="bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">One place.</span>
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground/50 leading-relaxed max-w-lg mx-auto">
            Keep every course, note, and study material organized in your personal academic workspace. No more scattered files — everything lives here.
          </p>
        </motion.div>

        {/* Courses Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative"
        >
          {/* Glow underneath */}
          <div className="absolute -inset-8 bg-indigo-600/[0.06] blur-[80px] rounded-3xl -z-10" />
          <div className="absolute -inset-4 bg-violet-600/[0.03] blur-[60px] rounded-3xl -z-10" />

          {/* Preview */}
          {isDesktop ? (
            <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_20px_80px_-20px_rgba(99,102,241,0.15)] bg-background">
              <CoursesPreview />
            </div>
          ) : (
            <CoursesMobilePreview />
          )}

          {/* Fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
