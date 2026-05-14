'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BookOpen, Plus, X, Check, Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getSharedNotifications, addSharedNote, dismissSharedNote } from '@/lib/supabase/actions';

/**
 * NOTIFICATION BELL
 * 
 * Shows a bell icon with a red dot when there are unread shared notes.
 * On click, opens a dropdown with the list of notifications.
 * Polls every 30 seconds for new notifications.
 */

interface SharedNotification {
  id: string;
  sharerName: string;
  sharerAvatar: string | null;
  courseCode: string;
  courseType: string;
  title: string;
  sharedAt: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<SharedNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const result = await getSharedNotifications();
    if (result.data) {
      setNotifications(result.data);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  const handleAdd = async (id: string) => {
    setLoadingId(id);
    const result = await addSharedNote(id);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
    setLoadingId(null);
  };

  const handleDismiss = async (id: string) => {
    setLoadingId(id);
    await dismissSharedNote(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setLoadingId(null);
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center active:scale-90 transition-transform relative"
      >
        <Bell className="w-4 h-4 text-muted-foreground/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[340px] max-h-[420px] bg-[#0c0c0e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-[15px] font-bold text-white tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {unreadCount} New
                </span>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px] custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium text-white/80">All caught up</p>
                    <p className="text-[12px] text-muted-foreground/50">No new notifications</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors relative group"
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        {notif.sharerAvatar ? (
                          <img
                            src={notif.sharerAvatar}
                            alt={notif.sharerName}
                            className="w-10 h-10 rounded-full shrink-0 object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full shrink-0 bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <span className="text-[14px] font-bold text-indigo-400">
                              {notif.sharerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium text-white/90 leading-snug">
                              <span className="font-bold">{notif.sharerName}</span> shared notes for <span className="font-bold text-indigo-400">{notif.courseCode}</span>
                            </p>
                            <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5">
                              {timeAgo(notif.sharedAt)}
                            </span>
                          </div>
                          
                          <p className="text-[12px] text-muted-foreground/60 mt-1 line-clamp-1 italic">
                            "{notif.title}"
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleAdd(notif.id)}
                              disabled={loadingId === notif.id}
                              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold transition-all disabled:opacity-50"
                            >
                              {loadingId === notif.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Add to Notes"
                              )}
                            </button>
                            <button
                              onClick={() => handleDismiss(notif.id)}
                              disabled={loadingId === notif.id}
                              className="h-8 px-4 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/60 hover:text-white transition-all text-[12px] font-medium"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
