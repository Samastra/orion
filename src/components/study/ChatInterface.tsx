'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PracticeView } from '@/components/practice/PracticeView';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/components/auth/UserAvatar';
import { ChatModeToggle, StudyMode } from './ChatModeToggle';
import { ChatWelcomeScreen } from './ChatWelcomeScreen';
import { ChatInputBar } from './ChatInputBar';
import { ChatMessageList } from './ChatMessageList';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  sessionId?: string;
  context?: string | string[] | null;
  fileName?: string;
  courseId?: string;
}

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatInterface = React.forwardRef<
  { clearChat: () => void },
  ChatInterfaceProps
>(({ sessionId, context, fileName, courseId }, ref) => {
  const { user } = useUser();
  const userName = user?.user_metadata?.nickname || user?.user_metadata?.full_name?.split(' ')[0];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<StudyMode>('study');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [shouldAutoPractice, setShouldAutoPractice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedActionRef = useRef<string | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Close mode menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setShowModeMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load chat history
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`study-chat-${sessionId}`);
    if (saved) {
      try { 
        let parsed = JSON.parse(saved);
        if (parsed.length === 1 && parsed[0].role === 'ai' && parsed[0].content.includes('Ready to master')) {
          parsed = [];
        }
        setMessages(parsed); 
      }
      catch { setMessages([]); }
    } else { setMessages([]); }
  }, [sessionId]);

  // Save chat history
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`study-chat-${sessionId}`, JSON.stringify(messages));
    }
  }, [sessionId, messages]);

  const sendToAI = async (allMessages: Message[]) => {
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, context, mode: 'study' }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.content, timestamp: ts() }]);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ The tutor is disconnected. Retrying...', timestamp: ts() }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => abortControllerRef.current?.abort();

  const switchMode = (newMode: StudyMode) => { 
    setMode(newMode); 
    setShowModeMenu(false); 
    if (newMode === 'study') setShouldAutoPractice(false);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: ts() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    sendToAI(updated);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([]);
    if (sessionId) localStorage.removeItem(`study-chat-${sessionId}`);
  };

  React.useImperativeHandle(ref, () => ({ clearChat }));

  const chatInput = (
    <ChatInputBar 
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      onSend={handleSend}
      onStop={handleStop}
      onKeyDown={handleKeyDown}
      textareaRef={textareaRef}
      mode={mode}
      showModeMenu={showModeMenu}
      setShowModeMenu={setShowModeMenu}
      switchMode={switchMode}
      modeMenuRef={modeMenuRef}
    />
  );

  return (
    <div className="h-full flex flex-col bg-background min-h-0 border-l border-white/[0.06]">
      {mode === 'practice' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <PracticeView 
            context={context ?? null} 
            courseId={courseId} 
            autoGenerate={shouldAutoPractice}
          />
          <div className="shrink-0 p-3 pt-0">
            <ChatModeToggle mode={mode} showMenu={showModeMenu} setShowMenu={setShowModeMenu} switchMode={switchMode} menuRef={modeMenuRef} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto min-h-0 scrollbar-hide flex flex-col">
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                  <ChatWelcomeScreen userName={userName} onAction={(id) => {
                    if (id === 'quiz') { setShouldAutoPractice(true); switchMode('practice'); return; }
                    const prompts: Record<string, string> = {
                      summarize: "Summarize this document.",
                      concepts: "What are the key concepts?",
                      chat: "I have a specific question...",
                    };
                    const content = prompts[id];
                    if (content) {
                      const userMsg: Message = { role: 'user', content, timestamp: ts() };
                      const updated = [...messages, userMsg];
                      setMessages(updated);
                      sendToAI(updated);
                    }
                  }}>
                    {chatInput}
                  </ChatWelcomeScreen>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                  <ChatMessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {messages.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 p-3 pt-0">
                {chatInput}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';
