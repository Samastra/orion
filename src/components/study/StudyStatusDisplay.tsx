'use client';

import React from 'react';
import { Loader2, Sparkles, FileWarning } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface StudyStatusDisplayProps {
  isLoading?: boolean;
  internalLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function StudyStatusDisplay({ isLoading, internalLoading, error, onRetry }: StudyStatusDisplayProps) {
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 gap-4 text-center">
        <FileWarning className="w-10 h-10 text-rose-400/80" />
        <p className="text-sm text-rose-400/80 font-medium">{error}</p>
        <Button onClick={onRetry} variant="outline" size="sm" className="rounded-xl border-rose-500/20 hover:bg-rose-500/5 text-xs">
          Try another file
        </Button>
      </div>
    );
  }

  if (isLoading || internalLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-2xl">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center">
              {isLoading ? (
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              ) : (
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">
              {isLoading ? "Transforming your notes..." : "Processing document..."}
            </h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed px-4">
              Our AI is restructuring your material into a premium study guide. This will only take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
