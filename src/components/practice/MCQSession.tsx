'use client';

import React, { useState } from 'react';
import { MCQCard, MCQQuestion } from './MCQCard';
import { ChevronLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MCQSessionProps {
  questions: MCQQuestion[];
  onReset: () => void;
}

export function MCQSession({ questions, onReset }: MCQSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [results, setResults] = useState<(boolean | null)[]>(new Array(questions.length).fill(null));

  const totalAnswered = answered.filter(Boolean).length;
  const allDone = totalAnswered === questions.length;

  const handleAnswer = (isCorrect: boolean) => {
    if (answered[currentIndex]) return;
    const newAnswered = [...answered];
    newAnswered[currentIndex] = true;
    setAnswered(newAnswered);

    const newResults = [...results];
    newResults[currentIndex] = isCorrect;
    setResults(newResults);

    if (isCorrect) setScore(s => s + 1);
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < questions.length) setCurrentIndex(index);
  };

  if (allDone) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Session Complete!</h2>
            <p className="text-muted-foreground/60 text-sm">
              You scored <span className="text-foreground font-bold">{score}/{questions.length}</span> ({percentage}%)
            </p>
          </div>

          {/* Score bar */}
          <div className="w-full bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-[13px] text-muted-foreground/40">
            {percentage >= 80 ? 'Excellent work! 🎉' : percentage >= 50 ? 'Good effort! Keep reviewing.' : 'Keep studying — you\'ll get there! 💪'}
          </p>

          {/* Results grid */}
          <div className="flex flex-wrap gap-1.5 justify-center pt-2">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); /* allow review */ }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all ${
                  r ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button onClick={onReset} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 px-5 mt-3">
            <RotateCcw className="w-4 h-4" />
            Generate New Set
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Progress bar */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground/50">
            {totalAnswered} of {questions.length} answered
          </span>
          <span className="text-[11px] font-bold text-indigo-400">
            Score: {score}/{totalAnswered}
          </span>
        </div>
        <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(totalAnswered / questions.length) * 100}%` }}
          />
        </div>
        {/* Question dots */}
        <div className="flex gap-1 mt-2 justify-center">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-6 h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex
                  ? 'bg-indigo-500'
                  : results[i] === true
                    ? 'bg-emerald-500/40'
                    : results[i] === false
                      ? 'bg-rose-500/40'
                      : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current question */}
      <div className="flex-1 overflow-auto px-5 py-4">
        <MCQCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          onAnswer={handleAnswer}
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
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === questions.length - 1}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px]"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
