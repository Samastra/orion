'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface MCQCardProps {
  question: MCQQuestion;
  questionNumber: number;
  onAnswer: (index: number, isCorrect: boolean) => void;
  initialSelected?: number | null;
  initialRevealed?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function MCQCard({ 
  question, 
  questionNumber, 
  onAnswer,
  initialSelected = null,
  initialRevealed = false
}: MCQCardProps) {
  const [selected, setSelected] = useState<number | null>(initialSelected);
  const [revealed, setRevealed] = useState(initialRevealed);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
    onAnswer(index, index === question.correctIndex);
  };

  return (
    <div className="space-y-5">
      {/* Question */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">
          Question {questionNumber}
        </span>
        <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;
          
          let style = 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer';
          
          if (revealed) {
            if (isCorrect) {
              style = 'border-emerald-500/30 bg-emerald-500/10';
            } else if (isSelected && !isCorrect) {
              style = 'border-rose-500/30 bg-rose-500/10';
            } else {
              style = 'border-white/[0.04] bg-white/[0.01] opacity-50';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${style}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                revealed && isCorrect
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : revealed && isSelected && !isCorrect
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-white/[0.04] text-muted-foreground/60'
              }`}>
                {revealed && isCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : revealed && isSelected && !isCorrect ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  OPTION_LABELS[i]
                )}
              </span>
              <span className={`text-[13px] leading-relaxed ${
                revealed && isCorrect ? 'text-emerald-300 font-medium' : 'text-foreground/80'
              }`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">Explanation</span>
          <p className="text-[13px] text-foreground/70 leading-relaxed mt-1">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
