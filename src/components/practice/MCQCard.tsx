'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  optionExplanations: string[];
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
        <div className="text-[15px] text-foreground/90 leading-relaxed font-bold prose prose-invert prose-sm max-w-none [&_p]:m-0">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {question.question}
          </ReactMarkdown>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;
          const explanation = question.optionExplanations?.[i];
          
          let style = 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer active:scale-[0.98] transition-all';
          
          if (revealed) {
            if (isCorrect) {
              style = 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
            } else if (isSelected && !isCorrect) {
              style = 'border-rose-500/30 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.05)]';
            } else {
              style = 'border-white/[0.04] bg-white/[0.01] opacity-40 grayscale-[0.5]';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full flex items-start gap-4 px-4 py-4 lg:py-3.5 rounded-2xl border transition-all text-left ${style}`}
            >
              <span className={`w-8 h-8 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center text-[12px] font-black shrink-0 mt-0.5 ${
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
              <div className="flex-1 space-y-2">
                <div className={`text-[13.5px] leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:m-0 ${
                  revealed && isCorrect ? 'text-emerald-300 font-bold' : 'text-foreground/80 font-medium'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {option}
                  </ReactMarkdown>
                </div>

                {revealed && explanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    className="text-[12px] leading-relaxed text-muted-foreground/70 border-t border-white/[0.05] pt-2"
                  >
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {explanation}
                    </ReactMarkdown>
                  </motion.div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
