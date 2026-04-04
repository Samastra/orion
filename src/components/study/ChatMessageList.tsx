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
            <div className="flex items-start gap-2 opacity-60">
              <span className="text-[10px] font-bold text-muted-foreground shrink-0 mt-1 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">You</span>
              <div className="text-[13px] text-foreground/70 leading-relaxed font-medium">
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
