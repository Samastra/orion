'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Swords, Settings, BookOpen, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  matchPaths?: string[];
}

interface BottomTabBarProps {
  onSettingsOpen: () => void;
}

export function BottomTabBar({ onSettingsOpen }: BottomTabBarProps) {
  const pathname = usePathname();
  const [showArenaSheet, setShowArenaSheet] = useState(false);

  // Generate a unique session ID for Study Mode links
  const sessionLink = `/study/session-${Math.random().toString(36).slice(2, 10)}`;

  const tabs: TabItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Home',
      href: '/dashboard',
      matchPaths: ['/dashboard'],
    },
    {
      icon: Swords,
      label: 'Arena',
      onClick: () => setShowArenaSheet(true),
      matchPaths: ['/dashboard/practice', '/study'],
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onSettingsOpen,
    },
  ];

  const isActive = (tab: TabItem) => {
    if (!tab.matchPaths) return false;
    return tab.matchPaths.some((p) =>
      p === '/dashboard' ? pathname === p : pathname.startsWith(p)
    );
  };

  return (
    <>
      {/* ─── Arena Action Sheet ─────────────────────────────── */}
      <AnimatePresence>
        {showArenaSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowArenaSheet(false)}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm lg:hidden"
            />

            {/* Action Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 380, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[85] lg:hidden px-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
            >
              {/* Actions card */}
              <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mb-2">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 text-center">
                  <p className="text-[13px] text-muted-foreground/50 font-medium">Choose your mode</p>
                </div>

                {/* Study Mode */}
                <Link
                  href={sessionLink}
                  onClick={() => setShowArenaSheet(false)}
                  className="block"
                >
                  <div className="flex items-center gap-4 px-5 py-3.5 active:bg-white/[0.06] transition-colors border-t border-white/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">Study Mode</p>
                      <p className="text-[12px] text-muted-foreground/40 mt-0.5">Upload docs & get AI explanations</p>
                    </div>
                  </div>
                </Link>

                {/* Practice */}
                <Link
                  href="/dashboard/practice"
                  onClick={() => setShowArenaSheet(false)}
                  className="block"
                >
                  <div className="flex items-center gap-4 px-5 py-3.5 active:bg-white/[0.06] transition-colors border-t border-white/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">Practice</p>
                      <p className="text-[12px] text-muted-foreground/40 mt-0.5">MCQs & Flashcards from your courses</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Cancel button (iOS style) */}
              <button
                onClick={() => setShowArenaSheet(false)}
                className="w-full bg-[#1c1c1e] rounded-2xl py-3.5 text-[16px] font-semibold text-indigo-400 active:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Tab Bar ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl border-t border-white/[0.06]" />

        <nav
          className="relative flex items-end justify-around px-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab);
            const content = (
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 pt-2.5 pb-1 px-5 rounded-2xl transition-colors duration-200',
                  active
                    ? 'text-indigo-400'
                    : 'text-muted-foreground/50 active:text-foreground'
                )}
              >
                <div className="relative">
                  <tab.icon className={cn('w-[22px] h-[22px]', active && 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]')} />
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  active ? 'text-indigo-400' : 'text-muted-foreground/40'
                )}>
                  {tab.label}
                </span>
              </motion.div>
            );

            if (tab.onClick) {
              return (
                <button
                  key={tab.label}
                  onClick={tab.onClick}
                  className="outline-none"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={tab.label} href={tab.href!} className="outline-none">
                {content}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
