import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, FileWarning, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PDFRenderer } from './PDFRenderer';
import { SelectionTooltip } from './SelectionTooltip';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface DocumentViewerProps {
  file?: File | null;
  content?: string | string[] | null;
  isLoading?: boolean;
  onUpload?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
}

export function DocumentViewer({ file, content, isLoading, onUpload, onSelectionAction }: DocumentViewerProps) {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileType = useMemo(() => {
    if (!file || !file.name) return null;
    return file.name.split('.').pop()?.toLowerCase() || null;
  }, [file]);

  // Process DOCX/PPTX files into HTML
  useEffect(() => {
    if (!file || !file.arrayBuffer) {
      setDocHtml(null);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || !ext) return;

    setInternalLoading(true);
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
            const slideFile = zip.file(slideFiles[i]);
            if (slideFile) {
              const slideContent = await slideFile.async('string');
              const texts = slideContent.match(/<a:t>([^<]*)<\/a:t>/g)
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
          }
          setDocHtml(html);
        } else {
          setError(`Unsupported file type: .${ext}`);
        }
      } catch (err) {
        console.error('Failed to process document:', err);
        setError('Failed to load document. Please try another file.');
      } finally {
        setInternalLoading(false);
      }
    };

    processFile();
  }, [file]);

  const handleSelectionAction = (action: string, text: string) => {
    if (onSelectionAction) onSelectionAction(action, text);
  };

  // If we have AI/Manual content but no real File object representing an original PDF/Doc
  const isDirectContent = typeof content === 'string' && (!file || !file.arrayBuffer);

  // Empty state
  if (!file && !isDirectContent && !isLoading) {
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

      {/* Global Loading States */}
      {(isLoading || internalLoading) && (
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
      )}

      {error ? (
        <div className="h-full flex flex-col items-center justify-center p-8 gap-4 text-center">
          <FileWarning className="w-10 h-10 text-rose-400/80" />
          <p className="text-sm text-rose-400/80 font-medium">{error}</p>
          <Button onClick={onUpload} variant="outline" size="sm" className="rounded-xl border-rose-500/20 hover:bg-rose-500/5 text-xs">
            Try another file
          </Button>
        </div>
      ) : isDirectContent ? (
        <div className="h-full overflow-auto px-10 py-12 bg-white/[0.01] modern-scrollbar">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="flex items-center gap-4 pb-8 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI Study Guide</p>
                <p className="text-[11px] text-muted-foreground/60">Generated by Orion Intelligence</p>
              </div>
            </div>
            
            <article className="prose prose-invert prose-indigo max-w-none 
              prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-12 prose-h1:mt-4
              prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-indigo-400/90 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4
              prose-h3:text-lg prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-5
              prose-p:text-foreground/80 prose-p:leading-[1.9] prose-p:text-[16px] prose-p:mb-8
              prose-li:text-foreground/80 prose-li:text-[16px] prose-li:my-3
              prose-strong:text-indigo-400/90 prose-strong:font-bold
              prose-table:w-full prose-table:border-collapse prose-table:my-10 prose-table:bg-white/[0.01] prose-table:rounded-2xl prose-table:overflow-hidden
              prose-th:bg-white/5 prose-th:p-4 prose-th:text-left prose-th:text-indigo-400 prose-th:font-bold prose-th:border prose-th:border-white/10 prose-th:uppercase prose-th:text-[11px] prose-th:tracking-widest
              prose-td:p-4 prose-td:border prose-td:border-white/5 prose-td:text-[14px]">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Custom rendering for blockquotes to make them clinical pearls
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-indigo-500/50 bg-indigo-500/5 px-8 py-6 rounded-r-2xl italic my-12" {...props} />
                  )
                }}
              >
                {content as string}
              </ReactMarkdown>
            </article>
            
            <div className="pt-12 border-t border-white/5 flex items-center justify-center opacity-20">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3" />
                <span>End of AI Guide</span>
              </div>
            </div>
          </div>
        </div>
      ) : fileType === 'pdf' ? (
        <PDFRenderer file={file!} onTextSelect={(text) => handleSelectionAction('explain', text)} />
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
