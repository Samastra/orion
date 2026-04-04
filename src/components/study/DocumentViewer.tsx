import React, { useMemo } from 'react';
import { PDFRenderer } from './PDFRenderer';
import { SelectionTooltip } from './SelectionTooltip';
import { StudyStatusDisplay } from './StudyStatusDisplay';
import { StudyEmptyState } from './StudyEmptyState';
import { StudyGuideView } from './StudyGuideView';
import { useFileProcessor } from '@/hooks/useFileProcessor';

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
  
  const { docHtml, internalLoading, error } = useFileProcessor(file);

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

  // Empty State: No file and no content
  if (!file && !isDirectContent && !isLoading) {
    return <StudyEmptyState onUpload={onUpload} />;
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      <SelectionTooltip onAction={handleSelectionAction} />

      {/* Loading & Errors */}
      <StudyStatusDisplay 
        isLoading={isLoading} 
        internalLoading={internalLoading} 
        error={error} 
        onRetry={onUpload} 
      />

      {/* Main Content Area */}
      {!error && (
        <>
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
        </>
      )}
    </div>
  );
}
