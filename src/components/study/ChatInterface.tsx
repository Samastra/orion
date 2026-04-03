'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Plus, BookOpen, Dumbbell, ChevronDown, Square } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PracticeView } from '@/components/practice/PracticeView';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

type StudyMode = 'study' | 'practice';

interface ChatInterfaceProps {
  sessionId?: string;
  context?: string | string[] | null;
  fileName?: string;
  selectionAction?: { action: string; text: string } | null;
  courseId?: string;
}

const INITIAL_GREETING = "Ready to master this material? Ask me to explain any concept from the text, or switch to **Practice** mode to test what you've learned so far.";

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Mode Toggle Component ──────────────────────────────────────────
interface ModeToggleProps {
  mode: StudyMode;
  showMenu: boolean;
  setShowMenu: (v: boolean) => void;
  switchMode: (m: StudyMode) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

function ModeToggle({ mode, showMenu, setShowMenu, switchMode, menuRef }: ModeToggleProps) {
  const ModeIcon = mode === 'practice' ? Dumbbell : BookOpen;
  const label = mode === 'practice' ? 'Practice' : 'Study';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
          mode === 'practice'
            ? 'text-indigo-400/80 bg-indigo-500/10 border-indigo-500/15 hover:bg-indigo-500/15'
            : 'text-muted-foreground/40 bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.06]'
        }`}
      >
        <ModeIcon className="w-3 h-3" />
        {label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]">
          <button
            onClick={() => switchMode('study')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${mode === 'study' ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
          >
            <BookOpen className={`w-4 h-4 ${mode === 'study' ? 'text-indigo-400' : 'text-muted-foreground/50'}`} />
            <div>
              <div className={`text-[12px] font-semibold ${mode === 'study' ? 'text-indigo-400' : 'text-foreground/80'}`}>Study</div>
              <div className="text-[10px] text-muted-foreground/40">Learn & understand</div>
            </div>
          </button>
          <div className="h-px bg-white/[0.06]" />
          <button
            onClick={() => switchMode('practice')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${mode === 'practice' ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
          >
            <Dumbbell className={`w-4 h-4 ${mode === 'practice' ? 'text-indigo-400' : 'text-muted-foreground/50'}`} />
            <div>
              <div className={`text-[12px] font-semibold ${mode === 'practice' ? 'text-indigo-400' : 'text-foreground/80'}`}>Practice</div>
              <div className="text-[10px] text-muted-foreground/40">MCQs & Flashcards</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Interface ────────────────────────────────────────────
export const ChatInterface = React.forwardRef<
  { clearChat: () => void },
  ChatInterfaceProps
>(({ sessionId, context, fileName, selectionAction, courseId }, ref) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<StudyMode>('study');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedActionRef = useRef<string | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Close mode menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setShowModeMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load chat history
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`study-chat-${sessionId}`);
    if (saved) {
      try { setMessages(JSON.parse(saved)); }
      catch { setMessages([{ role: 'ai', content: INITIAL_GREETING, timestamp: ts() }]); }
    } else {
      setMessages([{ role: 'ai', content: INITIAL_GREETING, timestamp: ts() }]);
    }
  }, [sessionId]);

  // Save chat history
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`study-chat-${sessionId}`, JSON.stringify(messages));
    }
  }, [sessionId, messages]);

  // Send to AI
  const sendToAI = async (allMessages: Message[]) => {
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, context, mode: 'study' }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.content, timestamp: ts() }]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('AI request cancelled');
        return;
      }
      console.error('AI error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ The tutor is currently disconnected. We are attempting to reconnect...', timestamp: ts() }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Selection actions
  useEffect(() => {
    if (!selectionAction || isLoading) return;
    
    // De-duplicate: Ensure we only process this specific action once
    const actionKey = `${selectionAction.action}-${selectionAction.text}`;
    if (processedActionRef.current === actionKey) return;
    processedActionRef.current = actionKey;

    const labels: Record<string, string> = {
      explain: '🔍 Explain this', summarize: '📝 Summarize this',
      quiz: '❓ Quiz me on this', key_concepts: '💡 Key concepts',
    };
    const label = labels[selectionAction.action] || 'Analyze this';
    const text = selectionAction.text.length > 300 ? selectionAction.text.slice(0, 300) + '...' : selectionAction.text;
    const userMsg: Message = { role: 'user', content: `${label}:\n\n> ${text}`, timestamp: ts() };
    
    // FIX: Separated state update and API call
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    sendToAI(updatedMessages);
  }, [selectionAction, isLoading, messages, sendToAI]);

  // Document greeting
  useEffect(() => {
    if (fileName && context && messages.length <= 1) {
      setMessages([{ role: 'ai', content: INITIAL_GREETING, timestamp: ts() }]);
    }
  }, [fileName, context, messages.length]);

  const switchMode = (newMode: StudyMode) => { setMode(newMode); setShowModeMenu(false); };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: ts() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    sendToAI(updatedMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages([{ role: 'ai', content: INITIAL_GREETING, timestamp: ts() }]);
    if (sessionId) localStorage.removeItem(`study-chat-${sessionId}`);
  };

  // Expose clearChat to parent via ref
  React.useImperativeHandle(ref, () => ({
    clearChat,
  }));

  return (
    <div className="h-full flex flex-col bg-background min-h-0 border-l border-white/[0.06]">
      {/* PRACTICE MODE */}
      {mode === 'practice' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <PracticeView context={context ?? null} courseId={courseId} />
          <div className="shrink-0 p-3 pt-0">
            <ModeToggle mode={mode} showMenu={showModeMenu} setShowMenu={setShowModeMenu} switchMode={switchMode} menuRef={modeMenuRef} />
          </div>
        </div>
      ) : (
        /* STUDY MODE — Chat Canvas + Input */
        <>
          {/* Canvas */}
          <div className="flex-1 overflow-auto min-h-0 px-5 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div className="flex items-start gap-2 opacity-60">
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0 mt-1 uppercase tracking-wider">You</span>
                    <div className="text-[13px] text-foreground/70 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none 
                    [&_p]:text-[13.5px] [&_p]:leading-[1.75] [&_p]:text-foreground/90
                    [&_strong]:text-foreground [&_strong]:font-semibold
                    [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2
                    [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1.5
                    [&_h3]:text-[14px] [&_h3]:font-medium [&_h3]:text-foreground/90
                    [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:text-[13.5px] [&_li]:leading-[1.75]
                    [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/50
                    [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_code]:font-mono
                    [&_hr]:border-white/[0.06] [&_hr]:my-4
                  ">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-400/60" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-muted-foreground/30 font-medium">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="shrink-0 p-3 pt-0">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl transition-colors focus-within:border-indigo-500/30">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the document..."
                rows={1}
                className="w-full bg-transparent px-4 pt-3 pb-1 text-[13px] text-foreground placeholder:text-muted-foreground/30 resize-none outline-none font-medium"
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <ModeToggle mode={mode} showMenu={showModeMenu} setShowMenu={setShowModeMenu} switchMode={switchMode} menuRef={modeMenuRef} />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
                    <Mic className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={isLoading ? handleStop : handleSend}
                    disabled={!isLoading && !input.trim()}
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-xl transition-all",
                      isLoading 
                        ? "bg-rose-600 hover:bg-rose-500 animate-in fade-in zoom-in duration-200" 
                        : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-white/5"
                    )}
                  >
                    {isLoading ? (
                      <Square className="w-2.5 h-2.5 text-white fill-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';
