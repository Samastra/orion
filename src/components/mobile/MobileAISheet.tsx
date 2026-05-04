'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, BookOpen, Lightbulb, Brain, MessageCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

// ─── Types ──────────────────────────────────────────────────────

interface Message {
  role: 'ai' | 'user';
  content: string;
}

interface MobileAISheetProps {
  open: boolean;
  onClose: () => void;
  noteId?: string;
  courseId?: string;
  title: string;
  subtitle?: string;
  quickPrompts?: string[];
  apiMode?: string;
}

// ─── Sub-component: Message Bubble (RESTORED ORIGINAL UI) ───────

function AIMessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] shadow-sm">
          <p className="text-[13px] text-white/90 font-medium leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-sm max-w-none
      [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-white/70 [&_p]:mb-3
      [&_strong]:text-white [&_strong]:font-semibold
      [&_em]:text-white/60 [&_em]:italic
      [&_h2]:text-[14px] [&_h2]:font-bold [&_h2]:text-indigo-400/80 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-white/5 [&_h2]:pb-1.5
      [&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-white/85 [&_h3]:mt-3 [&_h3]:mb-1.5
      [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_li]:text-white/70
      [&_li_strong]:text-indigo-300
      [&_blockquote]:border-l-3 [&_blockquote]:border-indigo-500/40 [&_blockquote]:bg-indigo-500/5 [&_blockquote]:py-2 [&_blockquote]:px-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-white/50 [&_blockquote]:my-3
      [&_code]:bg-white/[0.08] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono [&_code]:text-indigo-300
      [&_pre]:bg-white/[0.04] [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:p-0
      [&_table]:w-full [&_table]:text-[11px] [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-white/[0.06] [&_table]:rounded-lg [&_table]:overflow-hidden
      [&_thead]:bg-white/[0.05]
      [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:text-indigo-400/70 [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-white/[0.08]
      [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-white/[0.04] [&_td]:text-foreground/65
      [&_tr:last-child_td]:border-b-0
      [&_hr]:border-white/[0.06] [&_hr]:my-4
      [&_a]:text-indigo-400 [&_a]:underline
      [&_.katex]:text-[13px]
    ">
      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{message.content}</ReactMarkdown>
    </div>
  );
}

// ─── Sub-component: Typing Indicator (RESTORED ORIGINAL UI) ──────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest">Thinking</span>
    </div>
  );
}

// ─── Sub-component: Chat Input (RESTORED ORIGINAL UI) ────────────

function MobileAIChatInput({
  input, setInput, isLoading, onSend, onStop,
}: {
  input: string; setInput: (v: string) => void; isLoading: boolean; onSend: () => void; onStop: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className="px-4 pb-3 pt-2"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
    >
      <div className="flex items-end gap-2.5 bg-white/[0.05] border border-white/[0.1] rounded-2xl px-4 py-2.5 focus-within:border-indigo-500/30 focus-within:bg-white/[0.06] transition-all shadow-lg shadow-black/20">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Ask about this..."
          rows={1}
          className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/25 resize-none outline-none py-0.5 font-medium"
          style={{ minHeight: '22px', maxHeight: '80px' }}
        />
        <button
          onClick={isLoading ? onStop : onSend}
          disabled={!isLoading && !input.trim()}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
            isLoading
              ? 'bg-rose-500 active:bg-rose-400 shadow-lg shadow-rose-900/30'
              : 'bg-indigo-600 active:bg-indigo-500 disabled:opacity-20 disabled:bg-white/5 shadow-lg shadow-indigo-900/30'
          )}
        >
          {isLoading ? (
            <Square className="w-2.5 h-2.5 text-white fill-white" />
          ) : (
            <Send className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Quick Prompt Icons (RESTORED ORIGINAL ICONS) ───────────────

const PROMPT_ICONS: Record<string, React.ReactNode> = {
  'Summarize': <BookOpen className="w-3.5 h-3.5" />,
  'Key concepts': <Lightbulb className="w-3.5 h-3.5" />,
  'Quiz me': <Brain className="w-3.5 h-3.5" />,
  'Explain simply': <MessageCircle className="w-3.5 h-3.5" />,
};

// ─── Sub-component: Empty State (RESTORED ORIGINAL UI) ───────────

function AISheetEmptyState({
  quickPrompts, onSelectPrompt,
}: {
  quickPrompts: string[]; onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Glowing orb */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
          <Image src="/dobbyvisuals/icon app.png" alt="Dobby" width={36} height={36} className="w-9 h-9 object-contain" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-indigo-500/[0.06] blur-xl" />
      </div>

      <p className="text-[15px] font-bold text-white/90 mb-1">What can I help with?</p>
      <p className="text-[12px] text-muted-foreground/35 leading-relaxed max-w-[220px] mb-6">
        I&apos;ve read your document. Ask me anything.
      </p>

      {/* Quick prompt cards */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onSelectPrompt(p)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[12px] font-medium text-muted-foreground/50 active:bg-indigo-500/10 active:text-indigo-400 active:border-indigo-500/20 transition-all text-left"
          >
            <span className="text-indigo-400/50">{PROMPT_ICONS[p] || <BookOpen className="w-3.5 h-3.5" />}</span>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component (UI RESTORED + UNIFIED SYNC LOGIC) ───────────

export function MobileAISheet({
  open, onClose, noteId, courseId, title, subtitle,
  quickPrompts = ['Summarize', 'Key concepts', 'Quiz me', 'Explain simply'],
  apiMode = 'study',
}: MobileAISheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync Logic — Same as Desktop
  const [isIndexed, setIsIndexed] = useState<boolean | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check Sync Status — Same as Desktop
  useEffect(() => {
    const checkStatus = async () => {
      if (!noteId || !open) return;
      try {
        const res = await fetch(`/api/practice/index?noteId=${noteId}`);
        const data = await res.json();
        setIsIndexed(data.indexed);
      } catch (e) {
        console.error('Failed to check index status:', e);
      }
    };
    checkStatus();
  }, [noteId, open]);

  const handleIndexNote = async () => {
    if (!noteId || isIndexing) return false;
    setIsIndexing(true);
    try {
      const res = await fetch('/api/practice/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, courseId, force: true })
      });
      if (res.ok) {
        setIsIndexed(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Indexing failed:', e);
      return false;
    } finally {
      setIsIndexing(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const text = content || input;
    if (!text.trim() || isLoading) return;

    // 1. Show user message and start "Thinking" immediately
    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 2. INVISIBLE SYNC: If not indexed, do it silently before the AI call
      if (isIndexed !== true) {
        const success = await handleIndexNote();
        if (!success) {
          throw new Error("I had trouble reading your document. Please check if the note has content and try again.");
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })), noteId, courseId, mode: apiMode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'INSUFFICIENT_SHARDS') {
          throw new Error("You've run out of shards! Go to your dashboard to purchase more.");
        }
        throw new Error(err.error || 'API error');
      }

      // Stream the response — add an empty AI message and fill it incrementally
      const aiMsg: Message = { role: 'ai', content: '' };
      setMessages(prev => [...prev, aiMsg]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
            return updated;
          });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'ai', content: `⚠️ ${err.message || 'Could not reach the AI. Try again.'}` }]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[108] bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[110] flex flex-col rounded-t-[20px] overflow-hidden"
            style={{ height: '78vh' }}
          >
            {/* Background with subtle gradient (Preserved UI) */}
            <div className="absolute inset-0 bg-[#0a0a0c]" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.04] to-transparent" />
            <div className="absolute inset-0 border-t border-white/[0.08] rounded-t-[20px] pointer-events-none" />

            {/* Handle + header (Preserved UI) */}
            <div className="relative shrink-0">
              <div className="flex justify-center pt-2.5 pb-1.5">
                <div className="w-9 h-[4px] rounded-full bg-white/[0.12]" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/30 overflow-hidden">
                    <Image src="/dobbyvisuals/icon app.png" alt="Dobby" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white/95">{title}</p>
                    {subtitle && (
                      <p className="text-[10px] text-muted-foreground/35 font-medium truncate max-w-[200px]">{subtitle}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-[14px] font-semibold text-indigo-400 active:opacity-60 transition-opacity px-1"
                >
                  Done
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* Messages area (Preserved UI — Silent Indexing) */}
            <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col h-full">
                  <AISheetEmptyState
                    quickPrompts={quickPrompts}
                    onSelectPrompt={(p) => sendMessage(p)}
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AIMessageBubble message={msg} />
                    </motion.div>
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input (Preserved UI) */}
            <div className="relative shrink-0">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <MobileAIChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSend={() => sendMessage()}
                onStop={handleStop}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
