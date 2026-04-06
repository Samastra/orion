'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ messages, isLoading, messagesEndRef }: ChatMessageListProps) {
  return (
    <div className="px-5 py-6 space-y-8 flex-1">
      {messages.map((msg, i) => (
        <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {msg.role === 'user' ? (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">You</span>
              </div>
              <div className="text-[14px] text-white/50 leading-relaxed font-medium bg-white/[0.02] border border-white/[0.04] px-4 py-3 rounded-2xl max-w-[85%] italic">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none 
              [&_p]:text-[15px] [&_p]:leading-[1.9] [&_p]:text-white/70 [&_p]:mb-4
              [&_strong]:text-white [&_strong]:font-bold
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-indigo-400/90 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-white/5 [&_h2]:pb-2
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-5
              [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5 [&_li]:text-[15px] [&_li]:leading-[1.8] [&_li]:text-white/70
              [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500/50 [&_blockquote]:bg-indigo-500/5 [&_blockquote]:py-3 [&_blockquote]:px-5 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:my-6
              [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-indigo-300
              [&_hr]:border-white/10 [&_hr]:my-8
            ">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex items-center gap-2 py-2 text-indigo-400/40">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest">Processing...</span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
