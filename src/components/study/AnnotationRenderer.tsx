'use client';

import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Sparkles, Pencil, Trash2 } from 'lucide-react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Annotation {
  id: string;
  highlighted_text: string;
  content: string;
  type: 'ai' | 'manual';
  created_at: string;
}

interface AnnotationRendererProps {
  markdown: string;
  annotations: Annotation[];
  onDeleteAnnotation?: (id: string) => void;
}

// ─── STATEFUL CONTEXT ───────────────────────────────────────────────
// This keeps track of which annotation we are CURRENTLY "inside" 
// as we traverse the React tree.
interface RenderState {
  activeId: string | null;
}

export function AnnotationRenderer({ markdown, annotations, onDeleteAnnotation }: AnnotationRendererProps) {
  
  // 1. ROBUST SCAN & RESOLVE ENGINE: Finding all matches at once to prevent "ghost" stacking
  const processedMarkdown = useMemo(() => {
    if (annotations.length === 0) return markdown;
    
    interface Match {
      start: number;
      end: number;
      annoId: string;
      length: number;
    }
    
    let matches: Match[] = [];
    
    // Step 1: Scan for all possible matches for all annotations
    annotations.forEach((anno) => {
      const textToMatch = anno.highlighted_text.trim();
      if (!textToMatch) return;
      
      const flexiblePattern = textToMatch
        .split('')
        .map(c => {
          if (/\s/.test(c)) return `[\\s\\*\\_\\~\\\\\\n\\(\\)\\[\\]\\:\\-\\'\\"]*`; 
          const escaped = c.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
          return `[\\*\\_\\~\\\\\\n\\(\\)\\[\\]\\:\\-\\'\\"]*${escaped}`;
        })
        .join('') + `[\\*\\_\\~\\\\\\n\\(\\)\\[\\]\\:\\-\\'\\"]*`;
      
      const regex = new RegExp(flexiblePattern, 'gi');
      let m;
      while ((m = regex.exec(markdown)) !== null) {
        if (m.index === regex.lastIndex) regex.lastIndex++; // Prevent infinite loops
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          annoId: anno.id,
          length: m[0].length
        });
      }
    });
    
    // Step 2: Resolve Conflicts (Overlaps)
    // Sort matches by length (longest first) to prioritize better highlights
    const sortedPotentialMatches = matches.sort((a, b) => b.length - a.length || a.start - b.start);
    const finalMatches: Match[] = [];
    
    sortedPotentialMatches.forEach(match => {
      const isOverlapping = finalMatches.some(m => 
        (match.start >= m.start && match.start < m.end) || 
        (match.end > m.start && match.end <= m.end) ||
        (match.start <= m.start && match.end >= m.end)
      );
      if (!isOverlapping) finalMatches.push(match);
    });
    
    // Step 3: Inject Markers in reverse order to keep indices stable
    let resultText = markdown;
    const injectionPoints = finalMatches.sort((a, b) => b.start - a.start);
    
    injectionPoints.forEach(m => {
      const before = resultText.substring(0, m.start);
      const tagged = `:::ghost:${m.annoId}:::${resultText.substring(m.start, m.end)}:::endghost:::`;
      const after = resultText.substring(m.end);
      resultText = before + tagged + after;
    });
    
    return resultText;
  }, [markdown, annotations]);

  // 2. STATEFUL STITCHER: Shared state across nodes
  const GlobalState: RenderState = { activeId: null };

  const renderWithHighlights = useCallback((children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        const parts = child.split(/(:::ghost:[^:]*:::|:::endghost:::)/g);
        const result: React.ReactNode[] = [];

        return parts.map((part, i) => {
          if (part.startsWith(':::ghost:')) {
            GlobalState.activeId = part.replace(':::ghost:', '').replace(':::', '');
            return null;
          } else if (part === ':::endghost:::') {
            GlobalState.activeId = null;
            return null;
          } else if (part) {
            if (GlobalState.activeId) {
              const anno = annotations.find(a => a.id === GlobalState.activeId);
              return (
                <HighlightFragment 
                  key={`fragment-${GlobalState.activeId}-${i}`}
                  annotation={anno} 
                  onDelete={onDeleteAnnotation}
                >
                  {part}
                </HighlightFragment>
              );
            } else {
              return part;
            }
          }
          return null;
        });
      }
      
      // If we hit an element (strong, em, etc.) and we are currently "inside" an annotation,
      // we need to wrap that entire element in our highlight pill.
      const processedChild = React.isValidElement(child) && (child.props as any).children
        ? React.cloneElement(child, {
            ...(child.props as any),
            children: renderWithHighlights((child.props as any).children)
          } as any)
        : child;

      if (GlobalState.activeId) {
        const anno = annotations.find(a => a.id === GlobalState.activeId);
        return (
          <HighlightFragment 
            key={`nested-${GlobalState.activeId}`}
            annotation={anno} 
            onDelete={onDeleteAnnotation}
          >
            {processedChild}
          </HighlightFragment>
        );
      }

      return processedChild;
    });
  }, [annotations, onDeleteAnnotation]);

  return (
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
          td: ({children}) => <td className="px-5 py-3.5 text-[14px] text-foreground/75 border-b border-white/[0.04] leading-relaxed">{renderWithHighlights(children)}</td>,
          blockquote: ({children}) => <blockquote>{renderWithHighlights(children)}</blockquote>,
          // Shared formatting for other tags
          table: ({children}) => <div className="my-8 rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.015]"><table className="w-full border-collapse m-0">{children}</table></div>,
          th: ({children}) => <th className="px-5 py-3.5 text-left text-[11px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.08]">{children}</th>,
          hr: () => <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />,
        }}
      >
        {processedMarkdown}
      </ReactMarkdown>
    </article>
  );
}

// ─── Sub-Component: Highlight Fragment ────────────────────────────────
// The key here is that we ONLY show the HoverCard (tooltip) for the content
// that starts the highlight, but we style ALL fragments consistently.
function HighlightFragment({ 
  annotation, 
  children, 
  onDelete 
}: { 
  annotation?: Annotation; 
  children: React.ReactNode; 
  onDelete?: (id: string) => void;
}) {
  if (!annotation) return <>{children}</>;

  return (
    <HoverCard openDelay={50} closeDelay={150}>
      <HoverCardTrigger asChild>
        <span className="ghost-highlight animate-in fade-in duration-300">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="center"
        className="w-80 bg-neutral-900/90 backdrop-blur-2xl border-white/10 p-0 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200 z-[120]"
      >
        <div className="flex flex-col">
          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              {annotation.type === 'ai' ? <Sparkles className="w-3 h-3 text-indigo-400" /> : <Pencil className="w-3 h-3 text-indigo-400" />}
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{annotation.type === 'ai' ? 'AI Insight' : 'Your Note'}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(annotation.id); }}
              className="p-1 rounded-md hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[250px] modern-scrollbar custom-scrollbar pointer-events-auto">
            <div className="prose prose-invert prose-sm max-w-none [&_p]:text-[12.5px] [&_p]:leading-relaxed [&_p]:text-foreground/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{annotation.content ?? ""}</ReactMarkdown>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
