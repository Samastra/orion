'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Loader2, Save, Check, Pencil, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AnnotationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selection: { x: number; y: number; text: string } | null;
  action: string | 'manual';
  onSave?: (highlightedText: string, content: string, type: 'ai' | 'manual') => void;
  context?: string | string[] | null;
  initialContent?: string | null; // For viewing existing annotations
}

export function AnnotationOverlay({ 
  isOpen, 
  onClose, 
  selection, 
  action, 
  onSave, 
  context,
  initialContent 
}: AnnotationOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !selection) return;

    setContent(initialContent || '');
    setIsEditing(action === 'manual');
    setIsSaved(!!initialContent);

    if (action !== 'manual' && !initialContent) {
      handleAnalyze();
    }
  }, [isOpen, action, selection, initialContent]);

  const handleAnalyze = async () => {
    if (!selection) return;
    setLoading(true);
    try {
      const res = await fetch('/api/study/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          text: selection.text, 
          context 
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setContent(data.content);
    } catch (err) {
      setContent('⚠️ Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave && selection && content.trim()) {
      onSave(selection.text, content, action === 'manual' ? 'manual' : 'ai');
      setIsSaved(true);
      setTimeout(() => onClose(), 800);
    }
  };

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!isOpen || !selection) return null;

  // Calculate positioning (Desktop)
  const overlayHeight = 350; 
  const flip = selection.y < overlayHeight + 40;
  const x = Math.min(selection.x - 10, window.innerWidth - 330);
  const y = flip ? selection.y + 12 : selection.y - overlayHeight - 12;

  const contentUI = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {action === 'manual' ? (
            <Pencil className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {action === 'manual' ? 'Add Personal Note' : action.replace('_', ' ')}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors group">
          <X className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 modern-scrollbar custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin relative" />
            </div>
            <span className="text-xs text-muted-foreground/40 font-medium">Lecturer is thinking...</span>
          </div>
        ) : isEditing ? (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your notes here..."
            className="w-full h-32 lg:h-40 bg-transparent text-[14px] lg:text-[13px] text-foreground/90 placeholder:text-muted-foreground/20 resize-none outline-none leading-relaxed"
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none 
            [&_p]:text-[14px] lg:[&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:text-foreground/80 
            [&_ul]:my-2 [&_li]:text-[14px] lg:[&_li]:text-[13px] [&_li]:text-foreground/70"
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between pb-safe">
        {!initialContent && !loading && (
          <>
            <div className="text-[10px] text-muted-foreground/30 px-1 italic">
              Saved to highlights
            </div>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!content.trim() || isSaved}
              className={cn(
                "h-9 lg:h-8 rounded-xl gap-1.5 text-[11px] font-bold px-4 transition-all",
                isSaved 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              )}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </>
        )}
        
        {initialContent && !isEditing && (
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setIsEditing(true)}
             className="h-8 rounded-lg gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 px-2"
           >
             <Pencil className="w-3 h-3" /> Edit Note
           </Button>
        )}

        {isEditing && initialContent && (
           <div className="flex gap-2 w-full justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 lg:h-8 rounded-xl text-[11px] text-muted-foreground">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-9 lg:h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px]">
                Update
              </Button>
           </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[108] bg-black/60 backdrop-blur-sm"
            />
          )}

          <motion.div
            ref={overlayRef}
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={isDesktop ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed z-[120] overflow-hidden flex flex-col shadow-2xl shadow-black/80 ring-1 ring-white/5",
              isDesktop 
                ? "w-[320px] bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl" 
                : "bottom-0 left-0 right-0 bg-[#0a0a0c] rounded-t-[20px] border-t border-white/10"
            )}
            style={isDesktop ? {
              left: `${Math.max(16, x)}px`,
              top: `${y}px`,
              maxHeight: `${overlayHeight}px`,
            } : {
              height: 'auto',
              minHeight: '40vh',
              maxHeight: '80vh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >
            {!isDesktop && (
               <div className="flex justify-center pt-3 pb-1 shrink-0">
                 <div className="w-10 h-1 rounded-full bg-white/10" />
               </div>
            )}
            {contentUI}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
