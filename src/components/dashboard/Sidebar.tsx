'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  GraduationCap, 
  Settings, 
  LogOut,
  Search,
  MessageSquareWarning,
  MoreVertical
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [sessionLink, setSessionLink] = React.useState('/study/new');

  React.useEffect(() => {
    // Generate a unique session ID only on the client to avoid hydration mismatch
    setSessionLink(`/study/session-${Math.random().toString(36).slice(2, 10)}`);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: BookOpen, label: 'Study Mode', href: sessionLink },
    { icon: Target, label: 'Practice', href: '/dashboard/practice' },
    { icon: GraduationCap, label: 'Courses', href: '/dashboard/courses' },
  ];

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    { icon: MessageSquareWarning, label: 'Report Issue', href: '#' },
  ];

  return (
    <div className="w-64 h-screen border-r border-white/5 bg-background flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center border border-indigo-500/20">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">StudyBuddy</span>
      </div>

      <div className="px-4 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          <Input 
            placeholder="Search courses..." 
            className="pl-9 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl h-10"
          />
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
            <Link key={item.label} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
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
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
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
    </div>
  );
}

