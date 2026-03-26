'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minus, Plus, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PDFRendererProps {
  file: File;
  onTextSelect?: (text: string) => void;
}

export function PDFRenderer({ file, onTextSelect }: PDFRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    const loadPDF = async () => {
      setLoading(true);
      try {
        // @ts-ignore
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const arrayBuffer = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Failed to load PDF:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPDF();
    return () => { cancelled = true; };
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    let cancelled = false;

    const renderPage = async () => {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (cancelled) return;

        // Text layer
        const textContent = await page.getTextContent();
        const textLayer = textLayerRef.current!;
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        // @ts-ignore
        const { renderTextLayer } = await import('pdfjs-dist/legacy/build/pdf.mjs');
        
        if (renderTextLayer) {
          await renderTextLayer({
            textContentSource: textContent,
            container: textLayer,
            viewport,
          }).promise;
        } else {
          textContent.items.forEach((item: any) => {
            if (!item.str) return;
            const span = document.createElement('span');
            span.textContent = item.str;
            const tx = item.transform;
            const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
            span.style.position = 'absolute';
            span.style.left = `${tx[4]}px`;
            span.style.top = `${viewport.height - tx[5] - fontSize}px`;
            span.style.fontSize = `${fontSize}px`;
            span.style.fontFamily = item.fontName || 'sans-serif';
            span.style.transformOrigin = '0% 0%';
            span.style.color = 'transparent';
            span.style.whiteSpace = 'pre';
            textLayer.appendChild(span);
          });
        }
      } catch (err) {
        console.error('Failed to render page:', err);
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, scale]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 2 && onTextSelect) {
      onTextSelect(selectedText);
    }
  }, [onTextSelect]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-950/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
          <span className="text-xs font-medium text-muted-foreground tracking-wide">Loading document...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative group">
      {/* Floating Side Nav — Previous Page */}
      {currentPage > 1 && (
        <button
          onClick={() => goToPage(currentPage - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/80 hover:bg-black/80 hover:text-foreground hover:border-indigo-500/30 transition-all shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Floating Side Nav — Next Page */}
      {currentPage < totalPages && (
        <button
          onClick={() => goToPage(currentPage + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/80 hover:bg-black/80 hover:text-foreground hover:border-indigo-500/30 transition-all shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Floating Bottom Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-1.5 shadow-2xl shadow-black/40 opacity-0 group-hover:opacity-100 transition-all">
        <Button 
          variant="ghost" size="icon" 
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-2 min-w-[80px] justify-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">{currentPage}</span>
          <span className="text-xs text-muted-foreground/60 font-medium">/</span>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">{totalPages}</span>
        </div>
        
        <Button 
          variant="ghost" size="icon" 
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <Button 
          variant="ghost" size="icon" 
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[11px] font-semibold text-muted-foreground w-10 text-center font-mono tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button 
          variant="ghost" size="icon" 
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setScale(s => Math.min(3, s + 0.2))}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* PDF Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-950/40 flex justify-center py-8 px-4"
        onMouseUp={handleMouseUp}
      >
        <div className="relative inline-block rounded-sm shadow-2xl shadow-black/40">
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-[2px] rounded-sm">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          )}
          <canvas ref={canvasRef} className="block rounded-sm" />
          <div 
            ref={textLayerRef} 
            className="absolute top-0 left-0 overflow-hidden opacity-30"
            style={{ 
              lineHeight: '1',
              userSelect: 'text',
              pointerEvents: 'all',
            }}
          />
        </div>
      </div>
    </div>
  );
}
