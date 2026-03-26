'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, Mic, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  sessionId?: string;
  context?: string | string[] | null;
  fileName?: string;
  selectionAction?: { action: string; text: string } | null;
}

const DEFAULT_MESSAGES: Message[] = [
  {
    role: 'ai',
    content: "Upload a document and I'll help you study. Ask me anything — I can explain, summarize, quiz you, and more.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
];

export function ChatInterface({ sessionId, context, fileName, selectionAction }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages]);

  // Load chat history
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`study-chat-${sessionId}`);
    if (saved) {
      try { setMessages(JSON.parse(saved)); } 
      catch { setMessages(DEFAULT_MESSAGES); }
    } else {
      setMessages(DEFAULT_MESSAGES);
    }
  }, [sessionId]);

  // Save chat history
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`study-chat-${sessionId}`, JSON.stringify(messages));
    }
  }, [sessionId, messages]);

  // Selection actions
  useEffect(() => {
    if (!selectionAction) return;

    const labels: Record<string, string> = {
      explain: '🔍 Explain this',
      summarize: '📝 Summarize this',
      quiz: '❓ Quiz me on this',
      key_concepts: '💡 Key concepts from this',
    };

    const label = labels[selectionAction.action] || 'Analyze this';
    const text = selectionAction.text.length > 200
      ? selectionAction.text.slice(0, 200) + '...'
      : selectionAction.text;

    const userMsg: Message = {
      role: 'user',
      content: `${label}:\n\n> ${text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        explain: `Great question! Let me break down this passage for you.\n\nThe text discusses key concepts that are fundamental to understanding this topic. I can see references to important terminology and relationships between ideas.\n\nWould you like me to go deeper into any specific part?`,
        summarize: `Here's a concise summary:\n\n**Key Points:**\n- The main idea revolves around the core concepts mentioned\n- There are important relationships between the elements discussed\n- This connects to broader themes in the document\n\nWant me to elaborate?`,
        quiz: `Let's test your understanding! 🧠\n\n**Question:** Based on the passage you selected, which of the following best describes the main concept?\n\nA) Option A\nB) Option B\nC) Option C\nD) Option D\n\n*Select your answer and I'll explain the reasoning!*`,
        key_concepts: `**Key concepts** from your selection:\n\n1. **Concept 1** — The foundational idea presented\n2. **Concept 2** — A supporting detail\n3. **Concept 3** — An important relationship\n\nWould you like me to create flashcards from these?`,
      };

      const aiMsg: Message = {
        role: 'ai',
        content: responses[selectionAction.action] || responses.explain,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  }, [selectionAction]);

  // Document context greeting
  useEffect(() => {
    if (fileName && context && messages.length <= 1) {
      const greeting: Message = {
        role: 'ai',
        content: `I've analyzed **${fileName}**. I'm ready to help you study!\n\nI can see headings, formulas, and key concepts. What would you like to focus on first?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([greeting]);
    }
  }, [fileName, context, messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => {
      const aiMsg: Message = {
        role: 'ai',
        content: "Based on the document, I've found some relevant points. Would you like me to explain in deeper detail or generate a practice question?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    if (sessionId) localStorage.removeItem(`study-chat-${sessionId}`);
  };

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Header */}
      <div className="h-10 border-b border-white/[0.06] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-muted-foreground/70 tracking-wide">AI Tutor</span>
        </div>
        <Button onClick={clearChat} variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-400/5">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto min-h-0 p-4 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
              msg.role === 'ai' ? 'bg-indigo-600/80' : 'bg-white/5 border border-white/[0.08]'
            }`}>
              {msg.role === 'ai' 
                ? <Brain className="w-3.5 h-3.5 text-white" /> 
                : <span className="text-[10px] font-semibold text-foreground/60">S</span>
              }
            </div>
            <div className={`space-y-1 max-w-[88%] ${msg.role === 'ai' ? '' : 'items-end flex flex-col'}`}>
              <div className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === 'ai' 
                  ? 'bg-white/[0.03] border border-white/[0.06]' 
                  : 'bg-indigo-600 text-white'
              }`}>
                <div className="prose prose-invert prose-sm break-words overflow-hidden [&_p]:m-0 [&_p]:leading-relaxed [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/30 px-1 font-medium">
                {msg.role === 'ai' ? 'AI' : 'You'} · {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center animate-pulse">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Bar */}
      <div className="shrink-0 p-3 pt-0">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-indigo-500/30 transition-colors">
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
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-medium text-muted-foreground/20 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.04]">
                Study Mode
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
                <Mic className="w-3.5 h-3.5" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-7 w-7 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all disabled:opacity-30 disabled:bg-white/5"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
