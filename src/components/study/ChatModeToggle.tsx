'use client';

import React from 'react';
import { BookOpen, Dumbbell, ChevronDown } from 'lucide-react';

export type StudyMode = 'study' | 'practice';

interface ChatModeToggleProps {
  mode: StudyMode;
  showMenu: boolean;
  setShowMenu: (v: boolean) => void;
  switchMode: (m: StudyMode) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatModeToggle({ mode, showMenu, setShowMenu, switchMode, menuRef }: ChatModeToggleProps) {
  const ModeIcon = mode === 'practice' ? Dumbbell : BookOpen;
  const label = mode === 'practice' ? 'Practice' : 'Study';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
          mode === 'practice'
            ? 'text-indigo-400/80 bg-indigo-500/10 border-indigo-500/15 hover:bg-indigo-500/15'
            : 'text-muted-foreground/40 bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.06]'
        }`}
      >
        <ModeIcon className="w-3 h-3" />
        {label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]">
          <button
            onClick={() => switchMode('study')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${mode === 'study' ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
          >
            <BookOpen className={`w-4 h-4 ${mode === 'study' ? 'text-indigo-400' : 'text-muted-foreground/50'}`} />
            <div>
              <div className={`text-[12px] font-semibold ${mode === 'study' ? 'text-indigo-400' : 'text-foreground/80'}`}>Study</div>
              <div className="text-[10px] text-muted-foreground/40">Learn & understand</div>
            </div>
          </button>
          <div className="h-px bg-white/[0.06]" />
          <button
            onClick={() => switchMode('practice')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${mode === 'practice' ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
          >
            <Dumbbell className={`w-4 h-4 ${mode === 'practice' ? 'text-indigo-400' : 'text-muted-foreground/50'}`} />
            <div>
              <div className={`text-[12px] font-semibold ${mode === 'practice' ? 'text-indigo-400' : 'text-foreground/80'}`}>Practice</div>
              <div className="text-[10px] text-muted-foreground/40">MCQs & Flashcards</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
