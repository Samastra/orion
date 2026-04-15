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
import { Sparkles, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  sessionId?: string;
  noteId?: string;
  fileName?: string;
  courseId?: string;
}

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatInterface = React.forwardRef<
  { clearChat: () => void },
  ChatInterfaceProps
>(({ sessionId, noteId, fileName, courseId }, ref) => {
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

  // Indexing status
  const [isIndexed, setIsIndexed] = useState<boolean | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);

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

  // Check if note is indexed
  useEffect(() => {
    const checkStatus = async () => {
      if (!noteId) return;
      try {
        const res = await fetch(`/api/practice/index?noteId=${noteId}`);
        const data = await res.json();
        setIsIndexed(data.indexed);
      } catch (e) {
        console.error('Failed to check index status:', e);
      }
    };
    checkStatus();
  }, [noteId]);

  const handleIndexNote = async () => {
    if (!noteId || isIndexing) return false;
    setIsIndexing(true);
    try {
      const res = await fetch('/api/practice/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, courseId, force: true })
      });
      if (res.ok) {
        setIsIndexed(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Indexing failed:', e);
      return false;
    } finally {
      setIsIndexing(false);
    }
  };

  const sendToAI = async (allMessages: Message[]) => {
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // INVISIBLE SYNC: If not indexed, do it silently before the AI call
      if (isIndexed !== true) {
        const success = await handleIndexNote();
        if (!success) {
          throw new Error("I had trouble reading your document. Please check if the note has content and try again.");
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, noteId, courseId, mode: 'study' }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API error: ${res.status}`);
      }

      // Stream the response — add an empty AI message and fill it incrementally
      const aiMsg: Message = { role: 'ai', content: '', timestamp: ts() };
      setMessages(prev => [...prev, aiMsg]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
            return updated;
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${error.message || 'The tutor is disconnected. Retrying...'}`, timestamp: ts() }]);
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
            context={null} 
            noteId={noteId}
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
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col pt-12">
                  <div className="px-6 flex justify-center h-8">
                    {/* Invisible sync logic handles this area now */}
                  </div>

                  <ChatWelcomeScreen userName={userName} onAction={async (id) => {
                    if (id === 'quiz') { setShouldAutoPractice(true); switchMode('practice'); return; }
                    
                    const prompts: Record<string, string> = {
                      summarize: "Summarize this document.",
                      concepts: "What are the key concepts?",
                      chat: "I have a specific question...",
                    };
                    const content = prompts[id];
                    if (content) {
                      const userMsg: Message = { role: 'user', content, timestamp: ts() };
                      const updated = [userMsg];
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
