import React, { useMemo, useRef, useState, useCallback } from 'react';
import { FileText, FileUp, Upload, X } from 'lucide-react';
import { PDFRenderer } from './PDFRenderer';
import { SelectionTooltip } from './SelectionTooltip';
import { StudyStatusDisplay } from './StudyStatusDisplay';
import { StudyEmptyState } from './StudyEmptyState';
import { StudyGuideView } from './StudyGuideView';
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  file?: File | null;
  content?: string | string[] | null;
  isLoading?: boolean;
  onUpload?: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  annotations?: any[];
  onDeleteAnnotation?: (id: string) => void;
}

type ViewTab = 'notes' | 'pdf';

/**
 * PDF Upload Empty State — shown when no PDF has been loaded in the PDF tab.
 */
function PDFUploadState({ onSelectFile }: { onSelectFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      onSelectFile(droppedFile);
    }
  }, [onSelectFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onSelectFile(selected);
  }, [onSelectFile]);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full max-w-md flex flex-col items-center gap-5 p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          isDragOver
            ? "border-indigo-500/50 bg-indigo-500/[0.06]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Upload className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-[15px] font-bold text-white/90">Upload your PDF</p>
          <p className="text-[12px] text-muted-foreground/40 leading-relaxed max-w-[260px]">
            Drop your original document here to view it alongside your AI notes. Nothing is saved — it stays in your browser.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:bg-indigo-500 hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none">
          <FileUp className="w-3.5 h-3.5" />
          <span className="text-[12px]">Browse files</span>
        </div>
      </div>
    </div>
  );
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
  
  const { docHtml, internalLoading, error } = useFileProcessor(file);
  const [activeTab, setActiveTab] = useState<ViewTab>('notes');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fileType = useMemo(() => {
    if (!file || !file.name) return null;
    return file.name.split('.').pop()?.toLowerCase() || null;
  }, [file]);

  const handleSelectionAction = (action: string, text: string) => {
    if (onSelectionAction) onSelectionAction(action, text);
  };

  const docContent = useMemo(() => {
    if (!content) return "";
    return Array.isArray(content) ? content.join('\n\n') : content;
  }, [content]);

  const isDirectContent = typeof docContent === 'string' && docContent.length > 0 && (!file || !file.arrayBuffer);

  const containerRef = useRef<HTMLDivElement>(null);

  // Empty State: No file and no content
  if (!file && !isDirectContent && !isLoading) {
    return <StudyEmptyState onUpload={onUpload} />;
  }

  // Determine if the toggle should be shown — only when we have notes content
  const showToggle = isDirectContent && !isLoading && !error;

  return (
    <div className="h-full flex flex-col bg-background relative">
      <SelectionTooltip onAction={handleSelectionAction} containerRef={containerRef} />

      {/* ─── Tab Toggle ─────────────────────────────────── */}
      {showToggle && (
        <div className="shrink-0 flex items-center gap-1 px-6 pt-4 pb-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200",
              activeTab === 'notes'
                ? "bg-indigo-600 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50"
                : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200",
              activeTab === 'pdf'
                ? "bg-indigo-600 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50"
                : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <FileUp className="w-3.5 h-3.5" />
            PDF
            {pdfFile && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
            )}
          </button>

          {/* Show loaded PDF filename & clear button */}
          {activeTab === 'pdf' && pdfFile && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/40 font-medium truncate max-w-[180px]">
                {pdfFile.name}
              </span>
              <button
                onClick={() => setPdfFile(null)}
                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading & Errors */}
      <StudyStatusDisplay 
        isLoading={isLoading} 
        internalLoading={internalLoading} 
        error={error} 
        onRetry={onUpload} 
      />

      {/* Main Content Area */}
      {!error && (
        <div 
          className="flex-1 min-h-0 relative" 
          data-selection-area="true"
        >
          {/* ─── Notes Tab (always mounted, hidden via CSS) ── */}
          <div className={cn("h-full", activeTab === 'notes' ? "block" : "hidden")}>
            {isDirectContent ? (
              <StudyGuideView 
                content={docContent} 
                annotations={annotations} 
                onDeleteAnnotation={onDeleteAnnotation} 
              />
            ) : fileType === 'pdf' ? (
              <PDFRenderer file={file!} onTextSelect={(text) => handleSelectionAction('explain', text)} />
            ) : docHtml ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto px-10 py-8">
                  <div 
                    className="prose prose-invert prose-sm max-w-none [&_p]:leading-[1.8] [&_p]:text-[14px] 
                      [&_.slide-card]:mb-8 [&_.slide-card]:bg-white/5 [&_.slide-card]:p-6 [&_.slide-card]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: docHtml }} 
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* ─── PDF Tab (always mounted, hidden via CSS) ──── */}
          <div className={cn("h-full", activeTab === 'pdf' ? "block" : "hidden")}>
            {pdfFile ? (
              <PDFRenderer file={pdfFile} onTextSelect={(text) => handleSelectionAction('explain', text)} />
            ) : (
              <PDFUploadState onSelectFile={setPdfFile} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
