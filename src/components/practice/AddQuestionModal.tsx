'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSavedQuestion } from '@/lib/supabase/actions';

interface AddQuestionModalProps {
  courseId: string;
  onSuccess?: () => void;
}

export function AddQuestionModal({ courseId, onSuccess }: AddQuestionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('courseId', courseId);
    
    const result = await createSavedQuestion(formData);
    setIsSubmitting(false);
    
    if (result.data) {
      setIsOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button className="bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-6 font-bold gap-2 border border-white/10">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold">New Flashcard</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question (Front)</label>
              <textarea
                name="question"
                required
                placeholder="What is the capital of France?"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[100px] text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none shadow-inner"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Answer (Back)</label>
              <textarea
                name="answer"
                required
                placeholder="Paris"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[100px] text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none shadow-inner"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] mt-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Flashcard
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
