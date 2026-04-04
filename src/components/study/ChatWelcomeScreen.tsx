'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutList, BrainCircuit, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  userName?: string;
  onAction: (action: string) => void;
  children?: React.ReactNode;
}

export function ChatWelcomeScreen({ userName, onAction, children }: WelcomeScreenProps) {
  const actions = [
    { id: 'summarize', label: 'Summarize', icon: FileText, color: 'text-blue-400' },
    { id: 'concepts', label: 'Key Concepts', icon: LayoutList, color: 'text-indigo-400' },
    { id: 'quiz', label: 'Practice Quiz', icon: BrainCircuit, color: 'text-violet-400' },
    { id: 'chat', label: 'Ask anything', icon: MessageSquare, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-2xl mx-auto w-full min-h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center space-y-2 mb-4"
      >
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
          Hi{userName ? `, ${userName}` : ''}
        </h2>
        <h1 className="text-3xl md:text-3xl font-bold tracking-tight text-foreground/90 leading-tight">
          Where should we start?
        </h1>
      </motion.div>

      {/* The Centered Input Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {children}
      </motion.div>

      {/* Small Action Chips (Pills) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-2 max-w-lg"
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group cursor-pointer"
          >
            <action.icon className={cn("w-3.5 h-3.5 opacity-60 group-hover:opacity-100", action.color)} />
            <span className="text-[11px] font-bold text-muted-foreground/60 group-hover:text-foreground transition-colors uppercase tracking-widest">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
