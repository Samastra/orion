'use client';

import React, { useState } from 'react';
import { FlashCard, FlashcardData } from './FlashCard';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface FlashcardSessionProps {
  cards: FlashcardData[];
  onReset: () => void;
}

export function FlashcardSession({ cards, onReset }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = (index: number) => {
    if (index >= 0 && index < cards.length) setCurrentIndex(index);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress dots */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex gap-1 justify-center">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-6 h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex ? 'bg-indigo-500' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current card */}
      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <FlashCard
          key={currentIndex}
          card={cards[currentIndex]}
          cardNumber={currentIndex + 1}
          total={cards.length}
        />
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-5 pb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px]"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground/30 hover:text-foreground gap-1.5 text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Set
        </Button>

        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === cards.length - 1}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px]"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
