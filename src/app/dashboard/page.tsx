'use client';

import React from 'react';
import { CourseTable } from "@/components/dashboard/CourseTable";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar, useUser } from "@/components/auth/UserAvatar";
import { createClient } from '@/lib/supabase/client';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [courseCount, setCourseCount] = React.useState<number | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const nickname = user?.user_metadata?.nickname;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';
  const major = user?.user_metadata?.major || 'General Studies';
  const university = user?.user_metadata?.university;
  const greetingName = nickname || firstName;

  React.useEffect(() => {
    const fetchCourseCount = async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      
      if (!error) setCourseCount(count);
    };

    if (user) fetchCourseCount();
  }, [user]);

  const stats = [
    { label: 'Courses Active', value: courseCount !== null ? courseCount.toString() : '...', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Study Hours', value: '48.5h', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Practice Score', value: '92%', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Daily Streak', value: '14 Days', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  // ─── Mobile Layout ─────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="space-y-6 pb-8">
        {/* Progress prompt */}
        <div className="bg-indigo-500/[0.06] border border-indigo-500/10 rounded-2xl p-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            You&apos;ve completed <span className="text-indigo-400 font-semibold">85%</span> of your weekly study goals. Keep it up! 🔥
          </p>
        </div>

        {/* Stats — 2×2 compact grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground/50 font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/practice" className="block">
              <div className="bg-indigo-600/10 border border-indigo-500/15 rounded-2xl p-4 active:scale-[0.97] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold">Practice</p>
                <p className="text-[11px] text-muted-foreground/40 mt-0.5">MCQ & Flashcards</p>
              </div>
            </Link>
            <Link href="/dashboard/courses" className="block">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 active:scale-[0.97] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold">Courses</p>
                <p className="text-[11px] text-muted-foreground/40 mt-0.5">Manage Library</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight">Recent Courses</h2>
            <Link href="/dashboard/courses">
              <Button variant="link" className="text-indigo-400 font-semibold hover:text-indigo-300 p-0 h-auto text-[13px]">
                See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>
          <CourseTable />
        </div>
      </div>
    );
  }

  // ─── Desktop Layout (unchanged) ───────────────────────────────
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome, {userLoading ? '...' : greetingName} 👋
            </h1>
            {!userLoading && (
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                  {major}
                </span>
                {university && (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {university}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-lg">You&apos;ve completed <span className="text-indigo-500 font-semibold">85%</span> of your weekly study goals. Keep it up!</p>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar size="lg" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white/[0.02] border-white/5 overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-indigo-500/50 opacity-0 group-hover:opacity-100 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Course Insights</h2>
          <Button variant="link" className="text-indigo-400 font-semibold hover:text-indigo-300 p-0">
            View Analytics
          </Button>
        </div>
        
        {/* The Course Table */}
        <CourseTable />
      </div>
    </div>
  );
}
