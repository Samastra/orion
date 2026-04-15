'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
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
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">You</span>
              </div>
              <div className="text-[14px] text-white/90 leading-relaxed font-medium bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none 
              [&_p]:text-[15px] [&_p]:leading-[1.9] [&_p]:text-white/70 [&_p]:mb-4
              [&_strong]:text-white [&_strong]:font-bold
              [&_em]:text-white/60 [&_em]:italic
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-indigo-400/90 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-white/5 [&_h2]:pb-2
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-5 [&_h3]:mb-2
              [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5 [&_li]:text-[15px] [&_li]:leading-[1.8] [&_li]:text-white/70
              [&_li_strong]:text-indigo-300
              [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500/50 [&_blockquote]:bg-indigo-500/5 [&_blockquote]:py-3 [&_blockquote]:px-5 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:my-6
              [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-indigo-300
              [&_pre]:bg-white/[0.04] [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto
              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[13px]
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-[13px] [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-white/[0.08]
              [&_thead]:bg-white/[0.06]
              [&_th]:text-left [&_th]:text-[11px] [&_th]:font-bold [&_th]:text-indigo-400/80 [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-4 [&_th]:py-3 [&_th]:border-b [&_th]:border-white/[0.1]
              [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-white/[0.05] [&_td]:text-white/65 [&_td]:leading-relaxed
              [&_tr:last-child_td]:border-b-0
              [&_tbody_tr:hover]:bg-white/[0.02]
              [&_hr]:border-white/10 [&_hr]:my-8
              [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-indigo-300
              [&_.katex]:text-[15px]
            ">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
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
