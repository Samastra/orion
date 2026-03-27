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
  Search
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { signOut } from "@/lib/supabase/actions";

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: BookOpen, label: 'Study Mode', href: `/study/session-${Date.now().toString(36)}` },
  { icon: Target, label: 'Practice', href: '/dashboard/practice' },
  { icon: GraduationCap, label: 'Courses', href: '/dashboard/courses' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen border-r border-white/5 bg-background flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
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

      <div className="p-4 border-t border-white/5 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => signOut()}
          className="w-full justify-start gap-3 rounded-xl hover:bg-white/5 text-rose-400/80 hover:text-rose-400 hover:bg-rose-400/5"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

