'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  Upload, 
  ChevronRight, 
  Loader2,
  BookMarked,
  ArrowLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getNotes } from '@/lib/supabase/actions';
import { cn } from "@/lib/utils";

interface StudySelectorModalProps {
  open: boolean;
  onSelect: (course: any, note: any, type: 'original' | 'ai' | 'upload') => void;
}

export function StudySelectorModal({ open, onSelect }: StudySelectorModalProps) {
  const [step, setStep] = useState<'course' | 'note' | 'action'>('course');
  const [courses, setCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (data && !error) setCourses(data);
      setLoading(false);
    };

    if (open) fetchCourses();
  }, [open]);

  // Fetch notes when course is selected
  const handleCourseSelect = async (course: any) => {
    setSelectedCourse(course);
    setStep('note');
    setLoading(true);
    
    const { data, error } = await getNotes(course.id);
    if (data && !error) setNotes(data);
    setLoading(false);
  };

  const handleNoteSelect = (note: any) => {
    setSelectedNote(note);
    setStep('action');
  };

  const goBack = () => {
    if (step === 'note') setStep('course');
    if (step === 'action') setStep('note');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] h-[500px] p-0 overflow-hidden bg-[#0a0a0b] border-white/10 shadow-2xl rounded-2xl flex flex-col gap-0">
        <DialogTitle className="sr-only">Study Selection</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a course and note to begin your study session.
        </DialogDescription>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header with Step indicator */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] shrink-0">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                   <BookOpen className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold tracking-tight">
                     {step === 'course' && "Which course are you studying?"}
                     {step === 'note' && `Notes for ${selectedCourse?.name}`}
                     {step === 'action' && "How would you like to study?"}
                   </h2>
                   <p className="text-[12px] text-muted-foreground font-medium">
                     {step === 'course' && "Select a course to see its materials"}
                     {step === 'note' && "Choose a specific note or upload a PDF"}
                     {step === 'action' && "Select your preferred study mode"}
                   </p>
                 </div>
               </div>
               
               {step !== 'course' && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={goBack}
                   className="h-8 rounded-lg gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5"
                 >
                   <ArrowLeft className="w-3.5 h-3.5" /> Back
                 </Button>
               )}
             </div>

             {/* Progress Dots */}
             <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === 1 && step === 'course' ? "w-8 bg-indigo-500" : 
                      i === 2 && step === 'note' ? "w-8 bg-indigo-500" :
                      i === 3 && step === 'action' ? "w-8 bg-indigo-500" : "w-2 bg-white/10"
                    )}
                  />
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center opacity-50">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {step === 'course' && courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group group-hover:shadow-lg group-hover:shadow-indigo-500/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center font-bold text-indigo-400 text-xs border border-indigo-500/10">
                        {course.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[14px] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{course.name}</p>
                        <p className="text-[11px] text-muted-foreground/60">{course.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-indigo-400 transition-all" />
                  </button>
                ))}

                {step === 'note' && (
                  <>
                    <button
                      onClick={() => onSelect(selectedCourse, null, 'upload')}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all mb-2 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Upload className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[14px] text-foreground/90 tracking-tight group-hover:text-indigo-400 transition-colors">Upload Lecturer Material</p>
                        <p className="text-[11px] text-muted-foreground/60">Read directly from original PDF/Doc</p>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2 px-2 py-2">
                       <div className="h-[1px] flex-1 bg-white/5" />
                       <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Saved Notes</span>
                       <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    {notes.length === 0 ? (
                      <div className="py-12 text-center opacity-40 italic text-sm">No saved notes found for this course.</div>
                    ) : notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleNoteSelect(note)}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[14px] group-hover:text-emerald-400 transition-colors tracking-tight">{note.title}</p>
                            <p className="text-[11px] text-muted-foreground/60">Updated {new Date(note.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-400 transition-all" />
                      </button>
                    ))}
                  </>
                )}

                {step === 'action' && (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button
                      onClick={() => onSelect(selectedCourse, selectedNote, 'ai')}
                      className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all text-left flex flex-col gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                         <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[15px] text-foreground tracking-tight group-hover:text-indigo-400">Get AI Notes</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Let the AI restructure your raw notes into a well-organized, easy-to-read study guide.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => onSelect(selectedCourse, selectedNote, 'original')}
                      className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all text-left flex flex-col gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                         <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[15px] text-foreground tracking-tight group-hover:text-indigo-400">Study Original</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Read and review the original note as you wrote it.</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
