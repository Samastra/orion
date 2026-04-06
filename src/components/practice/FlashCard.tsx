'use client';

import React, { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface FlashcardData {
  id: string | number;
  front: string;
  back: string;
  category: string;
}

interface FlashCardProps {
  card: FlashcardData;
  cardNumber?: number;
  total?: number;
  onDelete?: (id: string | number) => void | Promise<void>;
}

export function FlashCard({ card, cardNumber, total, onDelete }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(card.id);
  };

  return (
    <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">
          {cardNumber && total ? `Card ${cardNumber} of ${total}` : 'Flashcard'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/30 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">
            {card.category}
          </span>
          {onDelete && (
            <button 
              onClick={handleDelete}
              className="p-1 text-muted-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Flip container */}
      <div 
        className="w-full cursor-pointer group"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full min-h-[320px] transition-all duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl border border-white/[0.08] bg-[#0A0A0B] p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(1px)'
            }}
          >
            <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest mb-4">Question</span>
            <div className="text-[16px] text-white/90 leading-relaxed font-bold prose prose-invert prose-sm max-w-none [&_p]:m-0">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {card.front}
              </ReactMarkdown>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-muted-foreground/25">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Tap to reveal</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl border border-indigo-500/20 bg-[#0D0D12] p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)'
            }}
          >
            <span className="text-[10px] font-semibold text-indigo-400/50 uppercase tracking-widest mb-4">Answer</span>
            <div className="text-[15px] text-white/80 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:m-0">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {card.back}
              </ReactMarkdown>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-indigo-400/20">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
