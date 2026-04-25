import React from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Trash2, 
  LayoutGrid, 
  List, 
  GraduationCap,
  Bell,
  LayoutDashboard,
  Swords,
  Settings
} from 'lucide-react';

export function CoursesMobilePreview() {
  const courses = [
    { name: 'ANA 203', type: 'ANATOMY', date: '3/31/2026' },
    { name: 'PIO 201', type: 'PHYSIOLOGY', date: '3/30/2026' },
    { name: 'PCT 201', subject: 'PHARMACEUTICS', date: '3/30/2026' },
    { name: 'BCH 201', subject: 'BIOCHEMISTRY', date: '3/29/2026' },
  ];

  return (
    <div className="bg-background w-full max-w-[340px] mx-auto rounded-[32px] overflow-hidden border border-white/[0.08] shadow-2xl aspect-[9/19] flex flex-col relative select-none text-left">
      {/* ─── Mobile Header (from MobileHeader.tsx) ────────── */}
      <div className="pt-8 px-5 pb-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-xs text-muted-foreground/50 font-medium mt-0.5">Your Library</p>
        </div>
        <div className="flex items-center gap-2.5 ml-4">
          <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
            <Bell className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-[12px] font-bold text-white border border-white/10">A</div>
        </div>
      </div>

      {/* ─── Page Content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-20 space-y-6 custom-scrollbar">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">My Courses</h2>
          <p className="text-muted-foreground text-[13px]">Manage your academic subjects and study materials.</p>
        </div>

        {/* New Course Button */}
        <div className="w-full h-11 bg-indigo-600 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[13px]">
          <Plus className="w-4 h-4" />
          New Course
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <div className="w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 flex items-center">
              <span className="text-[13px] text-muted-foreground/30">Search courses...</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
            <div className="p-1.5 rounded-lg bg-white/10 text-white shadow-sm">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="p-1.5 rounded-lg text-muted-foreground/40">
              <List className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Course Cards (Grid View) */}
        <div className="space-y-4">
          {courses.map((course, i) => (
            <div key={i} className="relative bg-white/[0.02] border border-white/5 rounded-[24px] p-5 flex flex-col h-full">
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="min-w-0">
                  <h3 className="font-bold text-[17px]">{course.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">{course.type}</span>
                  </div>
                </div>
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              
              <p className="text-[13px] text-muted-foreground/40 mt-4 leading-relaxed">
                No description provided.
              </p>

              <div className="pt-4 flex items-center justify-between mt-5 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground/30 font-medium">Added {course.date}</span>
                <Trash2 className="w-4 h-4 text-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom Tab Bar ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-20 border-t border-white/[0.06] bg-background/80 backdrop-blur-2xl flex items-center justify-around px-2 pb-5">
        <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
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
