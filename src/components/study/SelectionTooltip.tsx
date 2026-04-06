'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, BookOpen, HelpCircle, Lightbulb, X, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface SelectionTooltipProps {
  onAction: (action: string, text: string) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function SelectionTooltip({ onAction, containerRef }: SelectionTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, flip: false });
  const [selectedText, setSelectedText] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    // Small delay to let the selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 3 && selection) {
        // Check if selection is within a valid study area
        const anchor = selection.anchorNode;
        const parent = anchor?.nodeType === 3 ? anchor.parentElement : anchor;
        const isValidArea = (parent as HTMLElement)?.closest?.('[data-selection-area="true"]');
        
        if (!isValidArea) {
          setVisible(false);
          return;
        }

        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const padding = 16;
          const tooltipWidth = 260; // Estimated width
          const tooltipHeight = 48; // Estimated height
          
          // Calculate horizontal center
          let x = rect.left + rect.width / 2;
          
          // Clamp X to viewport
          const halfWidth = tooltipWidth / 2;
          if (x - halfWidth < padding) {
            x = padding + halfWidth;
          } else if (x + halfWidth > window.innerWidth - padding) {
            x = window.innerWidth - padding - halfWidth;
          }

          // Vertical flip ONLY if truly at the absolute top edge
          const flip = rect.top < 32; 
          const y = flip ? rect.bottom + 8 : rect.top - 8;

          setPosition({ x, y, flip });
          setSelectedText(text);
          setVisible(true);
        }
      } else {
        setVisible(false);
      }
    }, 10);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Don't hide if clicking on the tooltip itself
    if (tooltipRef.current?.contains(e.target as Node)) return;
    setVisible(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  const handleAction = (action: string) => {
    onAction(action, selectedText);
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, ${position.flip ? '0' : '-100%'})`,
      }}
    >
      {/* Arrow (Top) */}
      {position.flip && (
        <div className="flex justify-center -mb-1.5 relative z-10">
          <div className="w-3 h-3 bg-neutral-900 border-l border-t border-white/10 rotate-45" />
        </div>
      )}

      <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-1.5 flex items-center gap-1 ring-1 ring-white/5 whitespace-nowrap">
        <Button
          onClick={() => handleAction('explain')}
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 px-3 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Explain
        </Button>
        <div className="w-px h-5 bg-white/10" />
        <Button
          onClick={() => handleAction('simplify')}
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-3 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Simplify
        </Button>
        <div className="w-px h-5 bg-white/10" />
        <Button
          onClick={() => handleAction('manual')}
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 px-3 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          Annotate
        </Button>
      </div>

      {/* Arrow (Bottom) */}
      {!position.flip && (
        <div className="flex justify-center -mt-1.5">
          <div className="w-3 h-3 bg-neutral-900 border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </div>
  );
}
