'use client';

import React from 'react';
import { CourseTable } from "@/components/dashboard/CourseTable";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp,
  Bell,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar, useUser } from "@/components/auth/UserAvatar";
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [courseCount, setCourseCount] = React.useState<number | null>(null);
  
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
    { label: 'Courses Active', value: courseCount !== null ? courseCount.toString() : '...', icon: BookOpen, color: 'text-indigo-400' },
    { label: 'Study Hours', value: '48.5h', icon: Clock, color: 'text-violet-400' },
    { label: 'Practice Score', value: '92%', icon: Trophy, color: 'text-emerald-400' }, // 92% is >= 90, so Green is correct per user feedback
    { label: 'Daily Streak', value: '14 Days', icon: TrendingUp, color: 'text-rose-400' },
  ];

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
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </Button>
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

