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
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CourseStatsDrawer } from "@/components/dashboard/CourseStatsDrawer";
import { getPerformanceData, getDashboardStats } from "@/lib/supabase/actions";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from 'next/link';

// ─── MOTIVATIONAL TEXTS ─────────────────────────────────────────
// Rotates daily based on day-of-year
const MOTIVATIONAL_TEXTS = [
  "Small steps every day lead to big results. Keep going! 🚀",
  "The best time to study was yesterday. The next best time is now. 📚",
  "Consistency is the key to mastery. Show up every day. 💪",
  "Every page you read brings you closer to your goals. 🌟",
  "Your dedication today shapes your success tomorrow. ⏳",
  "The mind is like a muscle — the more you train it, the stronger it gets. 🧠",
  "Focus on progress, not perfection. 🔥",
  "Champions are made in the hours nobody sees. 🏆",
  "Learning never exhausts the mind. — Leonardo da Vinci 🎨",
  "You don't have to be great to start, but you have to start to be great. ✨",
  "Discipline is choosing what you want most over what you want now. 💎",
  "A little progress each day adds up to big results. 📈",
  "Stay curious. Stay hungry. Stay consistent. 🌱",
  "The expert in anything was once a beginner. Keep learning. 🎓",
];

function getMotivationalText(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_TEXTS[dayOfYear % MOTIVATIONAL_TEXTS.length];
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Stats Drawer State
  const [selectedCourse, setSelectedCourse] = React.useState<any | null>(null);
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);

  // Dashboard Stats (live data)
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [dashboardStats, setDashboardStats] = React.useState({
    courseCount: 0,
    practiceScore: null as number | null,
    studyHours: '0h',
    dailyStreak: 0,
  });
  
  const nickname = user?.user_metadata?.nickname;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';
  const major = user?.user_metadata?.major || 'General Studies';
  const university = user?.user_metadata?.university;
  const greetingName = nickname || firstName;

  // Fetch live dashboard stats
  React.useEffect(() => {
    const fetchStats = async () => {
      const result = await getDashboardStats();
      if (result.data) {
        setDashboardStats(result.data);
      }
      setStatsLoading(false);
    };

    if (user) fetchStats();
  }, [user]);

  // Fetch performance data for course stats drawer
  React.useEffect(() => {
    const fetchPerformance = async () => {
      const { data } = await getPerformanceData();
      if (data) setPerformanceData(data);
    };
    if (user) fetchPerformance();
  }, [user]);

  const activePerf = selectedCourse 
    ? performanceData.find(p => p.name === selectedCourse.name) 
    : null;

  const motivationalText = getMotivationalText();

  const stats = [
    { 
      label: 'Courses Active', 
      value: statsLoading ? '...' : dashboardStats.courseCount.toString(), 
      icon: BookOpen, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Study Hours', 
      value: statsLoading ? '...' : dashboardStats.studyHours, 
      icon: Clock, 
      color: 'text-violet-400', 
      bg: 'bg-violet-500/10' 
    },
    { 
      label: 'Practice Score', 
      value: statsLoading ? '...' : (dashboardStats.practiceScore !== null ? `${dashboardStats.practiceScore}%` : '—'), 
      icon: Trophy, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Daily Streak', 
      value: statsLoading ? '...' : `${dashboardStats.dailyStreak} ${dashboardStats.dailyStreak === 1 ? 'Day' : 'Days'}`, 
      icon: TrendingUp, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10' 
    },
  ];

  // ─── Mobile Layout ─────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="space-y-6 pb-8">
        {/* Motivational text */}
        <div className="bg-indigo-500/[0.06] border border-indigo-500/10 rounded-2xl p-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {motivationalText}
          </p>
        </div>

        {/* Stats — 2×2 compact grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 shrink-0 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-[17px] font-bold tracking-tight leading-none bg-clip-text truncate">
                  {stat.value}
                </p>
              </div>
              <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-[0.1em] pl-0.5 truncate leading-none">
                {stat.label}
              </p>
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
            <h2 className="text-lg font-bold tracking-tight">Courses</h2>
            <Link href="/dashboard/courses">
              <Button variant="link" className="text-indigo-400 font-semibold hover:text-indigo-300 p-0 h-auto text-[13px]">
                See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>
          <CourseTable onCourseClick={setSelectedCourse} />
        </div>

        {/* The Stats Drawer */}
        <CourseStatsDrawer 
          course={selectedCourse} 
          score={activePerf?.score || 0}
          totalQuestions={activePerf?.totalQuestions || 0}
          onClose={() => setSelectedCourse(null)} 
        />
      </div>
    );
  }

  // ─── Desktop Layout ────────────────────────────────────────────
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
          <p className="text-muted-foreground text-lg">{motivationalText}</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
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
