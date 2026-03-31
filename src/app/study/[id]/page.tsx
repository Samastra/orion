'use client';

import React, { useState, useRef, use, useCallback, useEffect } from 'react';
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
  GraduationCap,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { parseDocument } from "@/lib/document-parser";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { StudySelectorModal } from "@/components/study/StudySelectorModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | string[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectionAction, setSelectionAction] = useState<{ action: string; text: string } | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
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
        toast.error("Failed to extract text from PDF");
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
          // Set a fake "AI File" for the header
          setFile({ name: `${note.title} (AI Refined)`, type: 'text/markdown' } as any);
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
    }
  };

  const handleSelectionAction = useCallback((action: string, text: string) => {
    setSelectionAction({ action, text });
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden text-foreground">
      {/* Premium Minimal Header */}
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 bg-background/80 backdrop-blur-2xl z-20">
        {/* Left: Home + Document info */}
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
               <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                 <BookOpen className="w-3 h-3 text-indigo-400" />
                 <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight">{selectedCourse.name}</span>
               </div>
               <div className="w-px h-3 bg-white/[0.06]" />
            </>
          )}

          {file ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground/90 truncate max-w-[200px]">
                {file.name}
              </span>
              <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase">
                {file.name.includes('(AI Refined)') ? 'ai' : file.name.split('.').pop()}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground/50 font-medium">Study Session</span>
          )}
        </div>

        {/* Right: Upload + Avatar */}
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.pptx"
            onChange={handleFileChange}
          />
          
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

          <div className="w-px h-4 bg-white/[0.06]" />

          <UserAvatar size="md" />
        </div>
      </header>

      {/* Main Content — Docs get 70% */}
      <div className="flex-1 relative min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={65} minSize={35}>
            <DocumentViewer 
              file={file} 
              content={extractedText}
              isLoading={isParsing}
              onUpload={() => fileInputRef.current?.click()}
              onSelectionAction={handleSelectionAction}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-white/[0.04] w-[3px] hover:bg-indigo-500/40 transition-colors data-[resize-handle-state=drag]:bg-indigo-500/60" />
          
          <ResizablePanel defaultSize={35} minSize={25}>
            <ChatInterface 
              ref={chatRef}
              sessionId={id} 
              context={extractedText} 
              fileName={file?.name}
              selectionAction={selectionAction}
              courseId={selectedCourse?.id}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StudySelectorModal 
        open={isSelectorOpen} 
        onSelect={handleStartStudy} 
      />

      {/* Floating Global Toolbar (Left) */}
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
