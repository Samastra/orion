'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { MobileAISheet } from './MobileAISheet';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  course_id?: string;
}

interface MobileNoteReaderProps {
  note: Note;
  onClose: () => void;
}

/**
 * Full-screen mobile note reader.
 * Renders note content with full markdown + KaTeX support,
 * and a floating AI button that opens the reusable MobileAISheet.
 */
export function MobileNoteReader({ note, onClose }: MobileNoteReaderProps) {
  const [showAI, setShowAI] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col lg:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* ─── Top Nav Bar ─────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-indigo-400 active:opacity-60 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[14px] font-semibold">Back</span>
        </button>
        <div className="text-center flex-1 min-w-0 px-4">
          <p className="text-[13px] font-bold truncate">{note.title}</p>
        </div>
        <div className="w-12" />
      </div>

      {/* ─── Note Content (Markdown + KaTeX) ─────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-6">
          {/* Meta header */}
          <div className="space-y-2 mb-6">
            <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">Study Note</p>
            <h1 className="text-xl font-bold tracking-tight">{note.title}</h1>
            <p className="text-[11px] text-muted-foreground/30 font-medium">
              {new Date(note.created_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div className="h-px bg-white/[0.04] mb-6" />

          {/* Rendered markdown content */}
          <div className="prose prose-invert prose-sm max-w-none
            [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-foreground/80 [&_p]:mb-3
            [&_strong]:text-white [&_strong]:font-semibold
            [&_em]:italic [&_em]:text-foreground/65
            [&_h1]:text-[17px] [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-7 [&_h1]:mb-2 [&_h1]:tracking-tight
            [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-indigo-400/80 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-white/[0.05] [&_h2]:pb-1.5
            [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-white/85 [&_h3]:mt-5 [&_h3]:mb-1.5
            [&_h4]:text-[13px] [&_h4]:font-bold [&_h4]:text-white/75 [&_h4]:mt-3 [&_h4]:mb-1
            [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:text-[13px] [&_li]:leading-[1.75] [&_li]:text-foreground/80
            [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
            [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/30 [&_blockquote]:bg-indigo-500/[0.03] [&_blockquote]:py-2 [&_blockquote]:px-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-foreground/55 [&_blockquote]:my-4 [&_blockquote]:text-[12px]
            [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono [&_code]:text-indigo-300
            [&_pre]:bg-white/[0.03] [&_pre]:border [&_pre]:border-white/[0.05] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:text-[11px]
            [&_table]:w-full [&_table]:text-[11px] [&_table]:border-collapse
            [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:text-muted-foreground/50 [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-2.5 [&_th]:py-2 [&_th]:border-b [&_th]:border-white/[0.08] [&_th]:bg-white/[0.02] [&_th]:whitespace-nowrap
            [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:border-b [&_td]:border-white/[0.04] [&_td]:text-foreground/65 [&_td]:align-top
            [&_hr]:border-white/[0.05] [&_hr]:my-5
            [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1 [&_.katex-display]:-mx-2 [&_.katex-display]:px-2
            [&_.katex]:text-[13px]
          ">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto -mx-2 px-2 my-3">
                    <div className="rounded-lg border border-white/[0.06] overflow-hidden min-w-[320px]">
                      <table {...props} className="w-full">{children}</table>
                    </div>
                  </div>
                ),
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        </div>
        {/* Bottom padding so content isn't hidden behind FAB */}
        <div className="h-28" />
      </div>

      {/* ─── Floating AI Button (clean, no glow) ─────────── */}
      <AnimatePresence>
        {!showAI && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.4 }}
            onClick={() => setShowAI(true)}
            className="fixed right-5 z-[105] w-12 h-12 rounded-full bg-indigo-600 shadow-xl shadow-black/40 flex items-center justify-center active:scale-90 transition-transform border border-indigo-500/30"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <Image src="/dobbyvisuals/white-icon naked.png" alt="Dobby AI" width={22} height={22} className="w-[22px] h-[22px] object-contain" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── AI Chat Sheet ───────────────────────────────── */}
      <MobileAISheet
        open={showAI}
        onClose={() => setShowAI(false)}
        noteId={note.id}
        courseId={note.course_id}
        title="Dobby"
        subtitle={`Studying: ${note.title}`}
      />
    </motion.div>
  );
}
