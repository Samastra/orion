'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, FileWarning, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PDFRenderer } from './PDFRenderer';
import { SelectionTooltip } from './SelectionTooltip';

interface DocumentViewerProps {
  file?: File | null;
  onUpload?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
}

export function DocumentViewer({ file, onUpload, onSelectionAction }: DocumentViewerProps) {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileType = useMemo(() => {
    if (!file) return null;
    return file.name.split('.').pop()?.toLowerCase() || null;
  }, [file]);

  // Process DOCX/PPTX files into HTML
  useEffect(() => {
    if (!file) {
      setDocHtml(null);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return;

    setLoading(true);
    setError(null);

    const processFile = async () => {
      try {
        if (ext === 'docx') {
          const mammoth = (await import('mammoth')).default;
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocHtml(result.value);
        } else if (ext === 'pptx') {
          const JSZip = (await import('jszip')).default;
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          const slideFiles = Object.keys(zip.files)
            .filter(name => name.startsWith('ppt/slides/slide'))
            .sort((a, b) => {
              const aNum = parseInt(a.match(/\d+/)![0]);
              const bNum = parseInt(b.match(/\d+/)![0]);
              return aNum - bNum;
            });

          let html = '';
          for (let i = 0; i < slideFiles.length; i++) {
            const content = await zip.file(slideFiles[i])!.async('string');
            const texts = content.match(/<a:t>([^<]*)<\/a:t>/g)
              ?.map(match => match.replace(/<[^>]*>/g, ''))
              .filter(t => t.trim()) || [];
            
            html += `
              <div class="slide-card">
                <div class="slide-header">
                  <span class="slide-num">${i + 1}</span>
                  <span class="slide-label">Slide ${i + 1}</span>
                </div>
                ${texts.map(t => `<p class="slide-text">${t}</p>`).join('')}
              </div>
            `;
          }
          setDocHtml(html);
        } else {
          setError(`Unsupported file type: .${ext}`);
        }
      } catch (err) {
        console.error('Failed to process document:', err);
        setError('Failed to load document. Please try another file.');
      } finally {
        setLoading(false);
      }
    };

    processFile();
  }, [file]);

  const handleSelectionAction = (action: string, text: string) => {
    if (onSelectionAction) onSelectionAction(action, text);
  };

  // Empty state
  if (!file) {
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

  return (
    <div className="h-full flex flex-col bg-background relative">
      <SelectionTooltip onAction={handleSelectionAction} />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">Processing...</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="h-full flex flex-col items-center justify-center p-8 gap-4 text-center">
          <FileWarning className="w-10 h-10 text-rose-400/80" />
          <p className="text-sm text-rose-400/80 font-medium">{error}</p>
          <Button onClick={onUpload} variant="outline" size="sm" className="rounded-xl border-rose-500/20 hover:bg-rose-500/5 text-xs">
            Try another file
          </Button>
        </div>
      ) : fileType === 'pdf' ? (
        <PDFRenderer file={file} onTextSelect={(text) => handleSelectionAction('explain', text)} />
      ) : docHtml ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto px-10 py-8">
            <style jsx>{`
              .slide-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 12px;
                padding: 28px 32px;
                margin-bottom: 16px;
              }
              .slide-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255,255,255,0.04);
              }
              .slide-num {
                background: rgba(99,102,241,0.1);
                color: #818cf8;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: var(--font-mono);
              }
              .slide-label {
                color: rgba(255,255,255,0.4);
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.02em;
              }
              .slide-text {
                color: rgba(226, 232, 240, 0.85);
                font-size: 14px;
                line-height: 1.8;
                margin: 6px 0;
              }
            `}</style>
            <div 
              className="prose prose-invert prose-sm max-w-none [&_p]:leading-[1.8] [&_p]:text-[14px] [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium"
              dangerouslySetInnerHTML={{ __html: docHtml }} 
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
