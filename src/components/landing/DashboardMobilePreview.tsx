import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp,
  Bell,
  LayoutDashboard,
  Swords,
  Settings,
  ChevronRight,
  Target
} from 'lucide-react';

export function DashboardMobilePreview() {
  const stats = [
    { label: 'Courses Active', value: '8', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Study Hours', value: '48.5h', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Practice Score', value: '92%', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Daily Streak', value: '14 Days', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="bg-background w-full max-w-[340px] mx-auto rounded-[32px] overflow-hidden border border-white/[0.08] shadow-2xl aspect-[9/19] flex flex-col relative select-none text-left">
      {/* ─── Mobile Header ────────────────────────────────── */}
      <div className="pt-8 px-5 pb-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Hey, Astra 👋</h1>
          <p className="text-xs text-muted-foreground/50 font-medium mt-0.5">Your Dashboard</p>
        </div>
        <div className="flex items-center gap-2.5 ml-4">
          <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
            <Bell className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-[12px] font-bold text-white border border-white/10 shadow-lg shadow-indigo-600/20">A</div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Progress Card */}
        <div className="bg-indigo-500/[0.06] border border-indigo-500/10 rounded-2xl p-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            You&apos;ve completed <span className="text-indigo-400 font-semibold">85%</span> of your weekly study goals. Keep it up! 🔥
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 shrink-0 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-[17px] font-bold tracking-tight leading-none truncate">
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
            <div className="bg-indigo-600/10 border border-indigo-500/15 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold">Practice</p>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5 font-medium">MCQ & Flashcards</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold">Courses</p>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5 font-medium">Manage Library</p>
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight">Courses</h2>
            <div className="text-indigo-400 font-semibold text-[13px] flex items-center">
              See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-indigo-500" />
              <p className="text-[15px] font-bold">ANA 203</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
          </div>
        </div>
      </div>

      {/* ─── Bottom Tab Bar ──────────────────────────────── */}
      <div className="h-20 border-t border-white/[0.06] bg-background/80 backdrop-blur-2xl flex items-center justify-around px-2 pb-5">
        <div className="flex flex-col items-center gap-1 text-indigo-400">
          <LayoutDashboard className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
          <Swords className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-bold">Arena</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
          <Settings className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-bold">Settings</span>
        </div>
      </div>
    </div>
  );
}
