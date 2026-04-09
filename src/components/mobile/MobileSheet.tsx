'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Title shown at top of sheet */
  title?: string;
  /** Whether the sheet takes up the full screen (like iOS fullScreenCover) */
  fullScreen?: boolean;
  /** Custom class for the content area */
  className?: string;
}

export function MobileSheet({
  open,
  onOpenChange,
  children,
  title,
  fullScreen = false,
  className,
}: MobileSheetProps) {
  const dragControls = useDragControls();

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Dismiss if they dragged down fast or more than 100px
    if (info.velocity.y > 300 || info.offset.y > 100) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed left-0 right-0 z-[70] lg:hidden overflow-hidden',
              'bg-[#0c0c0d] border-t border-white/[0.08]',
              fullScreen
                ? 'top-0 bottom-0 rounded-none'
                : 'bottom-0 rounded-t-[20px] max-h-[92vh]',
            )}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-9 h-[5px] rounded-full bg-white/[0.15]" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.06]">
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-sm font-semibold text-indigo-400 active:opacity-60 transition-opacity px-2 py-1"
                >
                  Done
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className={cn(
                'overflow-y-auto overscroll-contain',
                fullScreen ? 'h-[calc(100vh-60px)]' : 'max-h-[80vh]',
                className
              )}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
