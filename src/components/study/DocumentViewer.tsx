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
            
            <style>{`
              .study-guide-article h1 {
                font-size: 28px !important;
                font-weight: 900 !important;
                letter-spacing: -0.02em !important;
                color: rgba(255,255,255,0.95) !important;
                margin-top: 8px !important;
                margin-bottom: 16px !important;
                line-height: 1.25 !important;
              }
              .study-guide-article h2 {
                font-size: 22px !important;
                font-weight: 700 !important;
                letter-spacing: -0.01em !important;
                color: rgba(129,140,248,0.9) !important;
                margin-top: 48px !important;
                margin-bottom: 20px !important;
                padding-bottom: 12px !important;
                border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                line-height: 1.3 !important;
              }
              .study-guide-article h3 {
                font-size: 18px !important;
                font-weight: 700 !important;
                color: rgba(255,255,255,0.88) !important;
                margin-top: 36px !important;
                margin-bottom: 14px !important;
                line-height: 1.35 !important;
              }
              .study-guide-article h4 {
                font-size: 15px !important;
                font-weight: 600 !important;
                color: rgba(255,255,255,0.75) !important;
                margin-top: 28px !important;
                margin-bottom: 10px !important;
                line-height: 1.4 !important;
              }
              .study-guide-article p {
                font-size: 15px !important;
                line-height: 1.9 !important;
                color: rgba(255,255,255,0.72) !important;
                margin-bottom: 24px !important;
              }
              .study-guide-article ul,
              .study-guide-article ol {
                margin-top: 16px !important;
                margin-bottom: 24px !important;
                padding-left: 24px !important;
              }
              .study-guide-article li {
                font-size: 15px !important;
                line-height: 1.8 !important;
                color: rgba(255,255,255,0.72) !important;
                margin-top: 6px !important;
                margin-bottom: 6px !important;
              }
              .study-guide-article strong {
                color: rgba(255,255,255,0.95) !important;
                font-weight: 700 !important;
              }
              .study-guide-article code {
                background: rgba(255,255,255,0.06);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 13px;
                color: rgba(129,140,248,0.85);
              }
              .study-guide-article a {
                color: rgba(129,140,248,0.9) !important;
                text-decoration: none !important;
              }
              .study-guide-article a:hover {
                text-decoration: underline !important;
              }
              .study-guide-article .katex-display {
                margin: 32px 0 !important;
                padding: 16px 24px !important;
                background: rgba(255,255,255,0.02) !important;
                border: 1px solid rgba(255,255,255,0.06) !important;
                border-radius: 12px !important;
              }
              .study-guide-article .katex {
                font-size: 1.05em !important;
              }
              .study-guide-article hr {
                border: none !important;
                height: 1px !important;
                background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent) !important;
                margin: 48px 0 !important;
              }
            `}</style>

            <article className="study-guide-article prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Blockquote — clinical pearls / key takeaways
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-indigo-500/50 bg-indigo-500/[0.06] px-6 py-5 rounded-r-xl italic my-8 [&_p]:text-indigo-200/80 [&_p]:mb-0 [&_strong]:text-indigo-300 [&_strong]:not-italic" {...props} />
                  ),
                  // Table wrapper — rounded card with border
                  table: ({node, ...props}) => (
                    <div className="my-8 rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.015]">
                      <table className="w-full border-collapse m-0" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead className="bg-white/[0.06]" {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.08]" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="px-5 py-3.5 text-[14px] text-foreground/75 border-b border-white/[0.04] leading-relaxed" {...props} />
                  ),
                  tr: ({node, ...props}) => {
                    // Cast children to array and check if first child is a th to detect header rows
                    const children = React.Children.toArray((props as any).children);
                    const isHeader = children.length > 0 && typeof children[0] === 'object' && (children[0] as any)?.type === 'th';
                    return (
                      <tr className={isHeader ? '' : 'even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors'} {...props} />
                    );
                  },
                  // Horizontal rule — subtle section divider
                  hr: ({node, ...props}) => (
                    <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" {...props} />
                  ),
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
