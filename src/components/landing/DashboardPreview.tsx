'use client';

import React from 'react';
import { BookOpen, Clock, Trophy, TrendingUp, LayoutDashboard, BookMarked, Target, GraduationCap, Settings, Flag, Search, Plus, Calendar, MoreHorizontal } from 'lucide-react';

/**
 * High-fidelity static replica of the actual Dobby AI dashboard.
 * Matches the real dashboard pixel-for-pixel with sidebar, stats, tabs, and course table.
 */
export function DashboardPreview() {
  const stats = [
    { label: 'Courses Active', value: '8', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Study Hours', value: '48.5h', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Practice Score', value: '92%', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Daily Streak', value: '14 Days', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', active: true },
    { icon: BookMarked, label: 'Study Mode', active: false },
    { icon: Target, label: 'Practice', active: false },
    { icon: GraduationCap, label: 'Courses', active: false },
  ];

  const courses = [
    { name: 'ANA 203', subject: 'anatomy', subjectColor: 'text-emerald-400 bg-emerald-500/10', date: '3/31/2026', status: 'Active' },
    { name: 'PIO 201', subject: 'physiology', subjectColor: 'text-violet-400 bg-violet-500/10', date: '3/30/2026', status: 'Active' },
    { name: 'PCT 201', subject: 'pharmaceutics', subjectColor: 'text-indigo-400 bg-indigo-500/10', date: '3/30/2026', status: 'Active' },
    { name: 'PCH 201', subject: 'pharmaceutical ch...', subjectColor: 'text-sky-400 bg-sky-500/10', date: '3/30/2026', status: 'Active' },
  ];

  return (
    <div className="w-full rounded-xl bg-[#0a0a0d] border border-white/[0.06] overflow-hidden shadow-2xl flex" style={{ height: '420px' }}>
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
                  : 'text-muted-foreground/40 hover:text-white/60'
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
            <Settings className="w-3.5 h-3.5" />
            Settings
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground/30">
            <Flag className="w-3.5 h-3.5" />
            Report Issue
          </div>
          {/* User */}
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
            <div className="flex items-center gap-2.5">
              <h2 className="text-[18px] font-bold text-white/90 tracking-tight">Welcome, Astra 👋</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-[8px] font-bold text-indigo-400 uppercase tracking-wider">Pharmacy</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">University of Ibadan</span>
            </div>
            <p className="text-[11px] text-muted-foreground/35 mt-1">
              You&apos;ve completed <span className="text-indigo-400 font-semibold">85%</span> of your weekly study goals. Keep it up!
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">A</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] text-muted-foreground/30 font-semibold uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
              </div>
              <p className="text-[16px] font-bold text-white/85">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Course Insights */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-bold text-white/80 tracking-tight">Course Insights</h3>
          <span className="text-[10px] text-indigo-400/60 font-semibold">View Analytics</span>
        </div>

        {/* Tabs + Manage */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
            <span className="px-3 py-1.5 rounded-md bg-white/[0.08] text-[10px] font-semibold text-white/80">Recent Courses</span>
            <span className="px-3 py-1.5 rounded-md text-[10px] font-medium text-muted-foreground/35">Performance</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-[10px] font-semibold text-white">
            <Plus className="w-3 h-3" />
            Manage All
          </div>
        </div>

        {/* Course Table */}
        <div className="bg-white/[0.015] border border-white/[0.04] rounded-xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-3 py-2 text-[8px] font-bold text-muted-foreground/25 uppercase tracking-wider">Course Name</th>
                <th className="text-left px-3 py-2 text-[8px] font-bold text-muted-foreground/25 uppercase tracking-wider">Subject</th>
                <th className="text-left px-3 py-2 text-[8px] font-bold text-muted-foreground/25 uppercase tracking-wider">Date Added</th>
                <th className="text-left px-3 py-2 text-[8px] font-bold text-muted-foreground/25 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr key={i} className="border-b border-white/[0.03] last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold text-white/70 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-muted-foreground/20" />
                    {course.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${course.subjectColor}`}>{course.subject}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground/30 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {course.date}
                  </td>
                  <td className="px-3 py-2.5 text-emerald-400/60 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                      {course.status}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <MoreHorizontal className="w-3 h-3 text-muted-foreground/15" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
