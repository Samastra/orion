'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export interface FlashcardData {
  id: number;
  front: string;
  back: string;
  category: string;
}

interface FlashCardProps {
  card: FlashcardData;
  cardNumber: number;
  total: number;
}

export function FlashCard({ card, cardNumber, total }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
      {/* Card number */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">
          Card {cardNumber} of {total}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/30 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">
          {card.category}
        </span>
      </div>

      {/* Flip container */}
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="relative w-full transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="w-full min-h-[280px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest mb-4">Question</span>
            <p className="text-[16px] text-foreground/90 leading-relaxed font-medium">
              {card.front}
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-muted-foreground/25">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Tap to reveal</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 w-full min-h-[280px] rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.03] p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-[10px] font-semibold text-indigo-400/50 uppercase tracking-widest mb-4">Answer</span>
            <p className="text-[15px] text-foreground/85 leading-relaxed">
              {card.back}
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-muted-foreground/25">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Tap to flip back</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
