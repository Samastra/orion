'use client';

import React from 'react';
import { BookOpen, Search, Plus, Trash2, LayoutGrid, List, GraduationCap, Settings, Flag, LayoutDashboard, BookMarked, Target } from 'lucide-react';

const courses = [
  { code: 'ANA 203', subject: 'Anatomy', description: 'No description provided.', date: '3/31/2026' },
  { code: 'PIO 201', subject: 'Physiology', description: 'No description provided.', date: '3/30/2026' },
  { code: 'PCT 201', subject: 'Pharmaceutics', description: 'No description provided.', date: '3/30/2026' },
  { code: 'PCH 201', subject: 'Pharmaceutical Chemistry', description: 'Studying the chemistry of dispensing and drug manufacturing', date: '3/30/2026' },
  { code: 'ANA 201', subject: 'Anatomy and Histology', description: 'Study of the structure of cells', date: '3/30/2026' },
  { code: 'BCH 201', subject: 'Biochemistry', description: 'No description provided.', date: '3/27/2026' },
];

const navItems = [
  { icon: LayoutDashboard, label: 'Home', active: false },
  { icon: BookMarked, label: 'Study Mode', active: false },
  { icon: Target, label: 'Practice', active: false },
  { icon: GraduationCap, label: 'Courses', active: true },
];

export function CoursesPreview() {
  return (
    <div className="w-full rounded-xl bg-[#0a0a0d] border border-white/[0.06] overflow-hidden shadow-2xl flex" style={{ height: '480px' }}>
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <div className="w-[180px] shrink-0 border-r border-white/[0.05] flex flex-col py-4 px-3">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-4 h-4" />
          </div>
          <span className="text-[12px] font-bold text-white/80">Dobby AI</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 mb-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <Search className="w-3 h-3 text-muted-foreground/30" />
          <span className="text-[10px] text-muted-foreground/25">Search courses...</span>
        </div>

        {/* Nav */}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                item.active
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                  : 'text-muted-foreground/40'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              {item.active && <div className="w-1 h-1 rounded-full bg-indigo-400 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-auto space-y-0.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground/30">
            <Settings className="w-3.5 h-3.5" />Settings
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground/30">
            <Flag className="w-3.5 h-3.5" />Report Issue
          </div>
          <div className="flex items-center gap-2 px-2 py-2 mt-2 border-t border-white/[0.04] pt-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-white/70 truncate">Astra</p>
              <p className="text-[8px] text-muted-foreground/25 truncate">OADEBAYO249...@STU...</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[20px] font-bold text-white/90 tracking-tight">My Courses</h2>
            <p className="text-[11px] text-muted-foreground/35 mt-0.5">Manage your academic subjects and study materials.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-[10px] font-semibold text-white shrink-0">
            <Plus className="w-3 h-3" />
            New Course
          </div>
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Search className="w-3 h-3 text-muted-foreground/25" />
            <span className="text-[10px] text-muted-foreground/20">Search courses...</span>
          </div>
          <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
            <div className="p-1.5 rounded-md bg-white/[0.08]">
              <LayoutGrid className="w-3 h-3 text-white/60" />
            </div>
            <div className="p-1.5 rounded-md">
              <List className="w-3 h-3 text-muted-foreground/25" />
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {courses.map((course, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between"
              style={{ height: '130px' }}
            >
              <div>
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <h3 className="text-[13px] font-bold text-white/85">{course.code}</h3>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-indigo-400/60 mt-0.5 flex items-center gap-1">
                      <GraduationCap className="w-2.5 h-2.5" />
                      {course.subject}
                    </p>
                  </div>
                  <BookOpen className="w-4 h-4 text-indigo-500/30 shrink-0" />
                </div>
                <p className="text-[9px] text-muted-foreground/30 leading-relaxed mt-1.5 line-clamp-2">{course.description}</p>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.03]">
                <span className="text-[8px] text-muted-foreground/20">Added {course.date}</span>
                <Trash2 className="w-2.5 h-2.5 text-muted-foreground/15" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
