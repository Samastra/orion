import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, FileText, FileWarning, Loader2, Sparkles, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PDFRenderer } from './PDFRenderer';
import { SelectionTooltip } from './SelectionTooltip';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import 'katex/dist/katex.min.css';

interface DocumentViewerProps {
  file?: File | null;
  content?: string | string[] | null;
  isLoading?: boolean;
  onUpload?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  annotations?: any[];
  onDeleteAnnotation?: (id: string) => void;
}

export function DocumentViewer({ 
  file, 
  content, 
  isLoading, 
  onUpload, 
  onSelectionAction, 
  annotations = [], 
  onDeleteAnnotation 
}: DocumentViewerProps) {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileType = useMemo(() => {
    if (!file || !file.name) return null;
    return file.name.split('.').pop()?.toLowerCase() || null;
  }, [file]);

  // HELPER: Recursively renders children, swapping ghost tokens for HoverCards
  const renderWithHighlights = useCallback((children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        const parts = child.split(/(:::ghost:[^:]*:::|:::endghost:::)/g);
        const result: React.ReactNode[] = [];
        let currentAnnoId: string | null = null;
        let currentText: string[] = [];

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;

          if (part.startsWith(':::ghost:')) {
            currentAnnoId = part.replace(':::ghost:', '').replace(':::', '');
          } else if (part === ':::endghost:::') {
            if (currentAnnoId) {
              const anno = annotations.find(a => a.id === currentAnnoId);
              const textContent = currentText.join('');
              if (anno) {
                result.push(
                  <HoverCard key={`anno-${anno.id}-${i}`} openDelay={100} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <span className="ghost-highlight">{textContent}</span>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="top" 
                      align="center"
                      className="w-80 bg-neutral-900/90 backdrop-blur-2xl border-white/10 p-0 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div className="flex flex-col">
                         <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {anno.type === 'ai' ? <Sparkles className="w-3 h-3 text-indigo-400" /> : <Pencil className="w-3 h-3 text-indigo-400" />}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{anno.type === 'ai' ? 'AI Insight' : 'Your Note'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] text-muted-foreground/30 font-medium text-white/40">{new Date(anno.created_at).toLocaleDateString()}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAnnotation?.(anno.id);
                                }}
                                className="p-1 rounded-md hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                         </div>
                         <div className="p-4 overflow-y-auto max-h-[250px] modern-scrollbar custom-scrollbar">
                            <div className="prose prose-invert prose-sm max-w-none 
                              [&_p]:text-[12.5px] [&_p]:leading-relaxed [&_p]:text-foreground/80 
                              [&_ul]:my-2 [&_li]:text-[12.5px] [&_li]:text-foreground/70"
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{anno.content ?? ""}</ReactMarkdown>
                            </div>
                         </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              } else {
                result.push(textContent);
              }
              currentAnnoId = null;
              currentText = [];
            }
          } else {
            if (currentAnnoId) {
              currentText.push(part);
            } else {
              result.push(part);
            }
          }
        }
        return result;
      }
      
      if (React.isValidElement(child) && (child.props as any).children) {
        return React.cloneElement(child, {
          ...(child.props as any),
          children: renderWithHighlights((child.props as any).children)
        } as any);
      }
      
      return child;
    });
  }, [annotations, onDeleteAnnotation]);

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

  const docContent = useMemo(() => {
    if (!content) return "";
    return Array.isArray(content) ? content.join('\n\n') : content;
  }, [content]);

  const isDirectContent = typeof docContent === 'string' && docContent.length > 0 && (!file || !file.arrayBuffer);

  const processedContent = useMemo(() => {
    if (annotations.length === 0) return docContent;
    let text = docContent;
    
    const sortedAnnotations = [...annotations].sort((a, b) => b.highlighted_text.length - a.highlighted_text.length);
    
    sortedAnnotations.forEach((anno) => {
      const textToMatch = anno.highlighted_text.trim();
      if (!textToMatch) return;
      
      const escaped = textToMatch.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      const flexiblePattern = escaped
        .split(/\s+/)
        .map((word: string) => {
          return word.split('').map(c => '[\\*\\_\\~\\`]*' + c).join('') + '[\\*\\_\\~\\`]*';
        })
        .join('[\\s\\*\\_\\~\\`\\n]+');
      
      const regex = new RegExp(`(?<!:::ghost:[^:]*:::)${flexiblePattern}`, 'gi');
      text = text.replace(regex, (match) => `:::ghost:${anno.id}:::${match}:::endghost:::`);
    });
    
    return text;
  }, [docContent, annotations]);

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
              .study-guide-article h1 { font-size: 28px !important; font-weight: 900 !important; color: rgba(255,255,255,0.95) !important; margin-bottom: 16px !important; line-height: 1.25 !important; }
              .study-guide-article h2 { font-size: 22px !important; font-weight: 700 !important; color: rgba(129,140,248,0.9) !important; margin-top: 48px !important; margin-bottom: 20px !important; padding-bottom: 12px !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
              .study-guide-article h3 { font-size: 18px !important; font-weight: 700 !important; color: rgba(255,255,255,0.88) !important; margin-top: 36px !important; line-height: 1.35 !important; }
              .study-guide-article p { font-size: 15px !important; line-height: 1.9 !important; color: rgba(255,255,255,0.72) !important; margin-bottom: 24px !important; }
              .study-guide-article li { font-size: 15px !important; line-height: 1.8 !important; color: rgba(255,255,255,0.72) !important; }
              .study-guide-article blockquote { border-left: 4px solid rgba(99, 102, 241, 0.5); background: rgba(99, 102, 241, 0.06); padding: 20px 24px; border-radius: 0 12px 12px 0; font-style: italic; margin: 32px 0; }
              .ghost-highlight {
                display: inline !important;
                background-color: rgba(99, 102, 241, 0.12) !important;
                border: 1px solid rgba(99, 102, 241, 0.25) !important;
                color: #a5b4fc !important;
                padding: 1px 6px !important;
                margin: 0 1px !important;
                border-radius: 6px !important;
                cursor: help !important;
                transition: all 0.2s ease;
                font-weight: 500 !important;
              }
              .ghost-highlight:hover {
                background-color: rgba(99, 102, 241, 0.25) !important;
                border-color: rgba(99, 102, 241, 0.6) !important;
                box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
              }
            `}</style>
            
            <article className="study-guide-article prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={{
                  p: ({children, ...props}) => <p {...props}>{renderWithHighlights(children)}</p>,
                  li: ({children, ...props}) => <li {...props}>{renderWithHighlights(children)}</li>,
                  h1: ({children, ...props}) => <h1 {...props}>{renderWithHighlights(children)}</h1>,
                  h2: ({children, ...props}) => <h2 {...props}>{renderWithHighlights(children)}</h2>,
                  h3: ({children, ...props}) => <h3 {...props}>{renderWithHighlights(children)}</h3>,
                  h4: ({children, ...props}) => <h4 {...props}>{renderWithHighlights(children)}</h4>,
                  // Table wrapper — rounded card with border
                  table: ({children}) => (
                    <div className="my-8 rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.015]">
                      <table className="w-full border-collapse m-0">{children}</table>
                    </div>
                  ),
                  thead: ({children}) => (
                    <thead className="bg-white/[0.06]">{children}</thead>
                  ),
                  th: ({children}) => (
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.08]">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-5 py-3.5 text-[14px] text-foreground/75 border-b border-white/[0.04] leading-relaxed">
                      {renderWithHighlights(children)}
                    </td>
                  ),
                  tr: ({children}) => {
                    const childrenArray = React.Children.toArray(children);
                    const isHeader = childrenArray.length > 0 && typeof childrenArray[0] === 'object' && (childrenArray[0] as any)?.type === 'th';
                    return (
                      <tr className={isHeader ? '' : 'even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors'}>
                        {children}
                      </tr>
                    );
                  },
                  blockquote: ({children}) => <blockquote>{renderWithHighlights(children)}</blockquote>,
                  hr: () => <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />,
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      ) : fileType === 'pdf' ? (
        <PDFRenderer file={file!} onTextSelect={(text) => handleSelectionAction('explain', text)} />
      ) : docHtml ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto px-10 py-8">
            <div 
              className="prose prose-invert prose-sm max-w-none [&_p]:leading-[1.8] [&_p]:text-[14px]"
              dangerouslySetInnerHTML={{ __html: docHtml }} 
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
