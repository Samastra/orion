'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  GraduationCap, 
  Settings, 
  LogOut,
  MessageSquareWarning,
  MoreVertical
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar, useUser } from "@/components/auth/UserAvatar";
import { signOut } from "@/lib/supabase/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SettingsDialog } from "./SettingsDialog";

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [sessionLink, setSessionLink] = React.useState('/study/new');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    // Generate a unique session ID only on the client to avoid hydration mismatch
    setSessionLink(`/study/session-${Math.random().toString(36).slice(2, 10)}`);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: BookOpen, label: 'Study Mode', href: sessionLink },
    { icon: Target, label: 'Practice', href: '/dashboard/practice' },
    { icon: GraduationCap, label: 'Courses', href: '/dashboard/courses' },
  ];

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', onClick: () => setIsSettingsOpen(true) },
    { icon: MessageSquareWarning, label: 'Report Issue', href: '#' },
  ];

  return (
    <div className="w-64 h-screen border-r border-white/5 bg-background hidden lg:flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <Image 
          src="/dobbyvisuals/icon app.png" 
          alt="" 
          width={28} 
          height={28} 
          className="w-7 h-7"
        />
        <Image 
          src="/dobbyvisuals/dobby name white.png" 
          alt="Dobby AI" 
          width={120} 
          height={32} 
          className="h-7 w-auto translate-y-[3px]"
          priority
        />
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Shards</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M12 2L4 8.5L12 22L20 8.5L12 2Z" fill="url(#shardGradient)" />
              <path d="M12 2L4 8.5H20L12 2Z" fill="white" fillOpacity="0.25" />
              <path d="M8 8.5L12 22L16 8.5H8Z" fill="white" fillOpacity="0.1" />
            </svg>
            <span className="text-[13px] font-bold text-white/90 tabular-nums">250</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
              pathname === item.href 
                ? "bg-indigo-600/10 text-indigo-400" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                pathname === item.href ? "text-indigo-400" : "group-hover:text-indigo-400"
              )} />
              {item.label}
              {pathname === item.href && (
                <div className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="px-2 pb-2 space-y-1">
          {bottomNavItems.map((item) => (
            'href' in item ? (
              <Link key={item.label} href={item.href as string} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ) : (
              <button 
                key={item.label} 
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all text-left"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          ))}
        </div>

        <div className="pt-2 border-t border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left group">
                <UserAvatar size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {loading ? '...' : (user?.user_metadata?.nickname || user?.user_metadata?.full_name || 'User')}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate uppercase tracking-tighter">
                    {user?.email}
                  </p>
                </div>
                <MoreVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 bg-[#0a0a0b] border-white/10" align="end" side="right">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-white/5"
                onClick={() => setIsSettingsOpen(true)}
              >
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="cursor-pointer focus:bg-rose-500/10 text-rose-400 focus:text-rose-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}

