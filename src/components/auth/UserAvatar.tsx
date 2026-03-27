'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable avatar component that fetches the current user's profile
 * and displays their initials with a gradient background.
 */
export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const nickname = user?.user_metadata?.nickname;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  
  const displayName = nickname || fullName;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-8 w-8 text-[11px]',
    lg: 'h-12 w-12 text-[14px]',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full border border-white/[0.08] flex items-center justify-center overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer group ${className}`}>
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20 group-hover:from-indigo-500/30 group-hover:to-violet-500/30">
        <span className="font-bold text-indigo-400">{initials}</span>
      </div>
    </div>
  );
}

/**
 * Hook to get the current authenticated user.
 * Returns { user, loading }.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
