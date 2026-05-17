'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserAvatar, useUser } from '@/components/auth/UserAvatar';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useShards } from '@/components/shards/ShardBalanceProvider';
import { ShardIcon } from '@/components/shards/ShardIcon';
import { ShardPurchaseModal } from '@/components/shards/ShardPurchaseModal';

interface MobileHeaderProps {
  onAvatarTap?: () => void;
}

export function MobileHeader({ onAvatarTap }: MobileHeaderProps) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const { balance, isLoading: shardsLoading } = useShards();
  const [isShardShopOpen, setIsShardShopOpen] = useState(false);

  const nickname = user?.user_metadata?.nickname;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';
  const greetingName = nickname || firstName;

  // Get page title based on route
  const getPageMeta = () => {
    if (pathname === '/dashboard') return { title: `Hey, ${loading ? '...' : greetingName}`, subtitle: 'Your Dashboard' };
    if (pathname === '/dashboard/practice') return { title: 'Arena', subtitle: 'Practice & Study' };
    if (pathname === '/dashboard/courses') return { title: 'Courses', subtitle: 'Your Library' };
    if (pathname.startsWith('/dashboard/courses/')) return { title: 'Course Detail', subtitle: '' };
    return { title: 'Dobby AI', subtitle: '' };
  };

  const { title, subtitle } = getPageMeta();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 lg:hidden transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={cn(
        'flex items-center justify-between px-5 transition-all duration-300',
        scrolled ? 'py-2.5' : 'py-4'
      )}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className={cn(
                'font-bold tracking-tight transition-all duration-300 truncate',
                scrolled ? 'text-base' : 'text-2xl'
              )}
            >
              {title}
            </h1>
            {pathname === '/dashboard' && !loading && (
              <button
                onClick={() => setIsShardShopOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all active:scale-95 cursor-pointer shrink-0 mt-0.5",
                  scrolled ? "bg-white/[0.04] border-white/[0.08]" : "bg-white/[0.06] border-white/[0.1] shadow-md shadow-black/10"
                )}
              >
                <ShardIcon size={12} />
                <span className="text-[11px] font-bold tabular-nums text-white/80">
                  {shardsLoading ? '...' : balance.toLocaleString()}
                </span>
              </button>
            )}
          </div>
          {subtitle && !scrolled && (
            <p className="text-xs text-muted-foreground/50 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-4">
          <NotificationBell />
          <button
            onClick={onAvatarTap}
            className="active:scale-90 transition-transform"
          >
            <UserAvatar size="sm" />
          </button>
        </div>
      </div>
      <ShardPurchaseModal open={isShardShopOpen} onOpenChange={setIsShardShopOpen} />
    </header>
  );
}
