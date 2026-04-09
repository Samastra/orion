'use client';

import React, { useState, useRef, use, useCallback } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { DocumentViewer } from "@/components/study/DocumentViewer";
import { ChatInterface } from "@/components/study/ChatInterface";
import { 
  Home, 
  Upload,
  Loader2,
  BookOpen,
  Pencil,
  Sparkles,
  Check,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { parseDocument } from "@/lib/document-parser";
import { updateNote, saveAnnotation, getAnnotations, deleteAnnotation } from "@/lib/supabase/actions";
import { AnnotationOverlay } from "@/components/study/AnnotationOverlay";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { StudySelectorModal } from "@/components/study/StudySelectorModal";
import { MobileAISheet } from "@/components/mobile/MobileAISheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | string[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayAction, setOverlayAction] = useState<string>('');
  const [overlaySelection, setOverlaySelection] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isAiModified, setIsAiModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileAI, setShowMobileAI] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<{ clearChat: () => void }>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsing(true);
      try {
        const { content } = await parseDocument(selectedFile);
        setExtractedText(content);
      } catch (error) {
        console.error("Failed to parse document:", error);
        toast.error("Failed to extract text from document");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleStartStudy = async (course: any, note: any, type: 'original' | 'ai' | 'upload') => {
    setSelectedCourse(course);
    setSelectedNote(note);
    setIsSelectorOpen(false);

    if (type === 'upload') {
      fileInputRef.current?.click();
      return;
    }

    if (type === 'ai' && note) {
      setIsParsing(true);
      try {
        const res = await fetch('/api/study/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: note.content }),
        });
        const data = await res.json();
        if (data.transformed) {
          setExtractedText(data.transformed);
          setFile({ name: `${note.title} (AI Refined)`, type: 'text/markdown' } as any);
          setIsAiModified(true);
          toast.success("AI Notes Generated!");
        } else {
          throw new Error(data.error || "Transformation failed");
        }
      } catch (err) {
        toast.error("AI Transformation failed. Showing original note.");
        setExtractedText(note.content);
        setFile({ name: note.title, type: 'text/plain' } as any);
      } finally {
        setIsParsing(false);
      }
    } else if (note) {
      setExtractedText(note.content);
      setFile({ name: note.title, type: 'text/plain' } as any);
      setIsAiModified(false);
      
      const { data } = await getAnnotations(note.id);
      if (data) setAnnotations(data);
    }
  };

  const handleSaveToCourse = async () => {
    if (!selectedNote || !extractedText || !isAiModified) return;
    
    setIsSaving(true);
    try {
      const textToSave = Array.isArray(extractedText) ? extractedText.join('\n\n') : extractedText;
      const firstLine = textToSave.split('\n')[0];
      const newTitle = firstLine.startsWith('# ') 
        ? firstLine.replace('# ', '').trim() 
        : selectedNote.title;

      const result = await updateNote(selectedNote.id, newTitle, textToSave, selectedCourse.id);
      if (result.error) throw new Error(result.error);
      
      toast.success("Study guide saved to your course!");
      setIsAiModified(false);
      
      if (result.data) {
        setSelectedNote(result.data);
        setFile((prev: any) => prev ? { ...prev, name: result.data.title } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectionAction = useCallback((action: string, text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setOverlaySelection({ x: rect.left + rect.width / 2, y: rect.bottom, text });
      setOverlayAction(action);
      setIsOverlayOpen(true);
    }
  }, []);

  const handleSaveAnnotation = async (highlightedText: string, content: string, type: 'ai' | 'manual') => {
    if (!selectedNote) return;
    const { data, error } = await saveAnnotation(selectedNote.id, highlightedText.trim(), content, type);
    if (data) setAnnotations(prev => [...prev, data]);
    else if (error) toast.error("Failed to save annotation");
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    const { success, error } = await deleteAnnotation(annotationId);
    if (success) {
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      toast.success("Annotation deleted");
    } else if (error) toast.error("Failed to delete annotation");
  };

  // Shared file input
  const fileInput = (
    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.pptx" onChange={handleFileChange} />
  );

  // Shared overlays
  const sharedOverlays = (
    <>
      <AnnotationOverlay 
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        selection={overlaySelection}
        action={overlayAction}
        onSave={handleSaveAnnotation}
        noteId={selectedNote?.id}
        courseId={selectedCourse?.id}
      />
      <StudySelectorModal open={isSelectorOpen} onSelect={handleStartStudy} />
    </>
  );

  // ─── MOBILE LAYOUT ─────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden text-foreground">
        {fileInput}

        {/* Compact Mobile Header */}
        <header className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link href="/dashboard">
              <button className="flex items-center text-indigo-400 active:opacity-60 transition-opacity shrink-0 p-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>

            {selectedCourse && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 shrink-0">
                <BookOpen className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight truncate max-w-[50px]">{selectedCourse.name}</span>
              </div>
            )}

            {file && (
              <span className="text-[12px] font-medium text-foreground/60 truncate min-w-0">
                {file.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedNote && isAiModified && (
              <Button 
                onClick={handleSaveToCourse}
                disabled={isSaving}
                className="h-7 rounded-lg gap-1 text-[10px] font-bold px-2 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Save
              </Button>
            )}
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="h-7 rounded-lg gap-1 text-[10px] font-bold px-2 bg-white/5 text-muted-foreground border border-white/5"
            >
              {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {file ? "Change" : "Upload"}
            </Button>
          </div>
        </header>

        {/* Full-screen Document */}
        <div className="flex-1 min-h-0 relative">
          <DocumentViewer 
            file={file} 
            content={extractedText}
            isLoading={isParsing}
            onUpload={() => fileInputRef.current?.click()}
            onSelectionAction={handleSelectionAction}
            annotations={annotations}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        </div>

        {/* Floating AI Button */}
        <AnimatePresence>
          {!showMobileAI && !isSelectorOpen && extractedText && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
              onClick={() => setShowMobileAI(true)}
              className="fixed right-4 z-[50] w-12 h-12 rounded-full bg-indigo-600 shadow-xl shadow-black/40 flex items-center justify-center active:scale-90 transition-transform border border-indigo-500/30"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* AI Chat Sheet */}
        <MobileAISheet
          open={showMobileAI}
          onClose={() => setShowMobileAI(false)}
          noteId={selectedNote?.id}
          courseId={selectedCourse?.id}
          title="AI Tutor"
          subtitle={file ? `Studying: ${file.name}` : 'Study Session'}
          quickPrompts={['Summarize', 'Key concepts', 'Quiz me', 'Explain simply']}
        />

        {sharedOverlays}
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ────────────────────────────
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden text-foreground">
      {fileInput}

      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 bg-background/80 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground/70 hover:text-foreground hover:bg-white/5">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-sm font-bold tracking-tight text-foreground/90 ml-1">StudyBuddy</span>
          <div className="w-px h-4 bg-white/[0.06]" />

          {selectedCourse && (
            <>
               <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 shrink-0">
                 <BookOpen className="w-3 h-3 text-indigo-400" />
                 <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight truncate max-w-[80px]">{selectedCourse.name}</span>
               </div>
               <div className="w-px h-3 bg-white/[0.06] shrink-0" />
            </>
          )}

          {file ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-medium text-foreground/90 truncate max-w-[180px] inline-block">{file.name}</span>
              <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                {file.name.includes('(AI Refined)') ? 'ai' : (file.name.includes('.') ? file.name.split('.').pop() : 'doc')}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground/50 font-medium">Study Session</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className={cn(
               "h-8 rounded-xl gap-1.5 text-[12px] font-bold px-3 transition-all",
               file ? "bg-white/5 text-muted-foreground hover:text-foreground border border-white/5" : "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {file ? "Change" : "Upload"}
          </Button>

          {selectedNote && isAiModified && (
            <Button 
              onClick={handleSaveToCourse}
              disabled={isSaving}
              className="h-8 rounded-xl gap-1.5 text-[12px] font-bold px-3 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Save AI Notes
            </Button>
          )}

          {!isAiModified && selectedNote && extractedText && (
            <div className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" />
              Synced
            </div>
          )}

          <div className="w-px h-4 bg-white/[0.06]" />
          <UserAvatar size="md" />
        </div>
      </header>

      <div className="flex-1 relative min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={65} minSize={35}>
            <DocumentViewer 
              file={file} 
              content={extractedText}
              isLoading={isParsing}
              onUpload={() => fileInputRef.current?.click()}
              onSelectionAction={handleSelectionAction}
              annotations={annotations}
              onDeleteAnnotation={handleDeleteAnnotation}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-white/[0.04] w-[3px] hover:bg-indigo-500/40 transition-colors data-[resize-handle-state=drag]:bg-indigo-500/60" />
          <ResizablePanel defaultSize={35} minSize={25}>
            <ChatInterface 
              ref={chatRef}
              sessionId={id} 
              noteId={selectedNote?.id}
              fileName={file?.name}
              courseId={selectedCourse?.id}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {sharedOverlays}

      {!isSelectorOpen && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => chatRef.current?.clearChat()}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all group"
            title="New Chat"
          >
            <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
}
