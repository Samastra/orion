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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { parseDocument } from "@/lib/document-parser";
import { UserAvatar } from "@/components/auth/UserAvatar";

export default function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | string[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectionAction, setSelectionAction] = useState<{ action: string; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } finally {
        setIsParsing(false);
      }
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
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-white/5">
              <Home className="w-4 h-4" />
            </Button>
          </Link>

          <div className="w-px h-4 bg-white/[0.06]" />

          {file ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground/90 truncate max-w-[280px]">
                {file.name}
              </span>
              <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase">
                {file.name.split('.').pop()}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground/50 font-medium">No document selected</span>
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
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-lg gap-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 text-[12px] font-medium px-2"
          >
            {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {file ? "Change" : "Upload"}
          </Button>

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* User Avatar */}
          <UserAvatar size="md" />
        </div>
      </header>

      {/* Main Content — Docs get 70% */}
      <div className="flex-1 relative min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={65} minSize={35}>
            <DocumentViewer 
              file={file} 
              onUpload={() => fileInputRef.current?.click()}
              onSelectionAction={handleSelectionAction}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-white/[0.04] w-[3px] hover:bg-indigo-500/40 transition-colors data-[resize-handle-state=drag]:bg-indigo-500/60" />
          
          <ResizablePanel defaultSize={35} minSize={25}>
            <ChatInterface 
              sessionId={id} 
              context={extractedText} 
              fileName={file?.name}
              selectionAction={selectionAction}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
