'use client';

import React from 'react';
import { Send, Mic, Plus, Square } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatModeToggle, StudyMode } from './ChatModeToggle';

interface ChatInputBarProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  mode: StudyMode;
  showModeMenu: boolean;
  setShowModeMenu: (v: boolean) => void;
  switchMode: (m: StudyMode) => void;
  modeMenuRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatInputBar({
  input,
  setInput,
  isLoading,
  onSend,
  onStop,
  onKeyDown,
  textareaRef,
  mode,
  showModeMenu,
  setShowModeMenu,
  switchMode,
  modeMenuRef
}: ChatInputBarProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] transition-all focus-within:border-indigo-500/30 focus-within:bg-white/[0.05] shadow-2xl shadow-black/20">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder="Ask about the document..."
        rows={1}
        className="w-full bg-transparent px-6 pt-5 pb-2 text-[14px] text-foreground placeholder:text-muted-foreground/30 resize-none outline-none font-medium selection:bg-indigo-500/30"
        style={{ minHeight: '32px', maxHeight: '120px' }}
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
            <Plus className="w-4 h-4" />
          </Button>
          <ChatModeToggle 
            mode={mode} 
            showMenu={showModeMenu} 
            setShowMenu={setShowModeMenu} 
            switchMode={switchMode} 
            menuRef={modeMenuRef} 
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5">
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            onClick={isLoading ? onStop : onSend}
            disabled={!isLoading && !input.trim()}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              isLoading 
                ? "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20" 
                : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-white/5 shadow-lg shadow-indigo-900/20"
            )}
          >
            {isLoading ? (
              <Square className="w-2.5 h-2.5 text-white fill-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
