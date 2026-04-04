'use client';

import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface StudyEmptyStateProps {
  onUpload?: () => void;
}

export function StudyEmptyState({ onUpload }: StudyEmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-neutral-950/30">
      <div className="max-w-sm w-full text-center space-y-5 px-8">
        <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto">
          <Upload className="text-muted-foreground/40 w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground/80">Upload a document</h2>
          <p className="text-[13px] text-muted-foreground/50 leading-relaxed">
            Drop a PDF, Word, or PowerPoint file to begin studying.
          </p>
        </div>
        <Button 
          onClick={onUpload}
          className="bg-indigo-600 text-white rounded-xl font-medium px-6 h-10 text-[13px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
        >
          Choose File
        </Button>
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground/30 font-mono">.pdf</span>
          <span className="text-muted-foreground/15">·</span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">.docx</span>
          <span className="text-muted-foreground/15">·</span>
          <span className="text-[10px] text-muted-foreground/30 font-mono">.pptx</span>
        </div>
      </div>
    </div>
  );
}
