'use client';

import React, { useState } from 'react';
import { FlashCard, FlashcardData } from './FlashCard';
import { ChevronLeft, ChevronRight, RotateCcw, Trophy, Sparkles, Check, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createQuestionSession } from "@/lib/supabase/actions";
import { toast } from "sonner";

interface FlashcardSessionProps {
  cards: FlashcardData[];
  onReset: () => void;
  courseId?: string;
  suggestedTitle?: string;
}

export function FlashcardSession({ cards, onReset, courseId, suggestedTitle }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(suggestedTitle || '');
  const [showFinish, setShowFinish] = useState(false);

  React.useEffect(() => {
    if (suggestedTitle) setSessionTitle(suggestedTitle);
  }, [suggestedTitle]);

  const goTo = (index: number) => {
    if (index >= 0 && index < cards.length) {
      setCurrentIndex(index);
      setShowFinish(false);
    } else if (index >= cards.length) {
      setShowFinish(true);
    }
  };

  const handleSaveSession = async () => {
    if (!courseId || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      const res = await createQuestionSession(courseId, sessionTitle || "Untitled Flashcards", 'flashcard', cards);
      if (res.error) {
        toast.error(res.error);
      } else {
        setIsSaved(true);
        toast.success("Flashcard batch saved!");
      }
    } catch (err) {
      toast.error("Failed to save session");
    } finally {
      setIsSaving(false);
    }
  };

  if (showFinish) {
    return (
      <div className="h-full overflow-y-auto p-4 lg:p-6 bg-background scrollbar-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <div className="min-h-full flex items-center justify-center py-10">
          <div className="text-center space-y-5 lg:space-y-6 w-full max-w-sm animate-in fade-in zoom-in duration-500">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl lg:text-xl font-bold text-foreground">Deck Complete!</h2>
              <p className="text-muted-foreground/60 text-sm">
                You've reviewed all <span className="text-foreground font-bold">{cards.length}</span> cards in this set.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {courseId && !isSaved && (
                <div className="flex flex-col gap-2.5 p-4 bg-white/[0.03] rounded-xl border border-white/5 mb-2">
                   <div className="flex items-center gap-2 px-1 text-left">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Suggested Title</span>
                   </div>
                   <input 
                     type="text"
                     value={sessionTitle}
                     onChange={(e) => setSessionTitle(e.target.value)}
                     className="bg-white/[0.03] border border-white/5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/30 px-3 py-2 w-full"
                     placeholder="Enter session title..."
                   />
                   <Button 
                     onClick={handleSaveSession} 
                     disabled={isSaving}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 rounded-lg h-10 gap-2 text-[11px] font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
                   >
                     {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                     Save Batch to Course
                   </Button>
                </div>
              )}

              {isSaved && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                  <Check className="w-4 h-4" />
                  Batch Saved
                </div>
              )}

              <Button onClick={() => { setShowFinish(false); setCurrentIndex(0); }} variant="outline" className="border-white/5 bg-white/5 hover:bg-white/10 text-foreground rounded-xl gap-2 h-11 lg:h-12 font-bold transition-all active:scale-[0.98]">
                <RotateCcw className="w-4 h-4" />
                Review Again
              </Button>
              <Button onClick={onReset} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 h-11 lg:h-12 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all active:scale-[0.98]">
                <Sparkles className="w-4 h-4" />
                Generate New Set
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Progress dots */}
      <div className="shrink-0 px-4 lg:px-5 pt-4 pb-2">
        <div className="flex gap-1 justify-center overflow-x-auto scrollbar-none max-w-full">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`min-w-[20px] lg:w-6 h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                i === currentIndex ? 'bg-indigo-500' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current card */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-5 py-4">
        <FlashCard
          key={currentIndex}
          card={cards[currentIndex]}
          cardNumber={currentIndex + 1}
          total={cards.length}
        />
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-4 lg:px-5 pb-4 flex items-center justify-between" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px] h-10 lg:h-9 px-3"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground/30 hover:text-foreground gap-1.5 text-[11px] h-10 lg:h-9"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Set
        </Button>

        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex + 1)}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px] h-10 lg:h-9 px-3"
        >
          {currentIndex === cards.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
