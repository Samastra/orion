import React from 'react';
import { Plus } from 'lucide-react';

// Static mock of the Course Insights / Performance Chart (desktop view)
export function ProgressDesktopPreview() {
  const courses = [
    { name: 'PCG 201', score: 88, color: '#10b981' },
    { name: 'PHM 201', score: 78, color: '#6366f1' },
    { name: 'BCH 201', score: 62, color: '#6366f1' },
    { name: 'ANA 201', score: 85, color: '#10b981' },
    { name: 'PCH 201', score: 82, color: '#6366f1' },
    { name: 'PCT 201', score: 91, color: '#10b981' },
    { name: 'PIO 201', score: 60, color: '#f59e0b' },
    { name: 'ANA 203', score: 0, color: 'rgba(255,255,255,0.08)' },
  ];

  const barHeight = 220;
  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className="w-full rounded-xl bg-[#0a0a0d] border border-white/[0.06] overflow-hidden">
      <div className="p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight">Course Insights</h3>
          <span className="text-[13px] text-indigo-400 font-semibold">View Analytics</span>
        </div>

        {/* Tabs + Button row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            <div className="px-4 py-1.5 rounded-lg text-muted-foreground/50 text-[12px] font-bold">
              Recent Courses
            </div>
            <div className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[12px] font-bold">
              Performance
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] font-bold text-foreground">
            <Plus className="w-3.5 h-3.5" />
            Manage All
          </div>
        </div>

        {/* Chart area */}
        <div className="bg-white/[0.01] rounded-2xl border border-white/5 p-6">
          {/* Chart header */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h4 className="text-[13px] font-bold tracking-tight">Course Mastery</h4>
              <p className="text-[10px] text-muted-foreground/50">Based on your first-time MCQ attempts only</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06] border border-white/[0.08]" />
                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">Mastery Goal (100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Average Score</span>
              </div>
            </div>
          </div>

          {/* Chart with Y-axis and bars */}
          <div className="flex gap-3">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-[9px] text-muted-foreground/30 font-bold w-8 text-right" style={{ height: `${barHeight}px` }}>
              {yTicks.map(t => <span key={t}>{t}</span>)}
            </div>

            {/* Bars */}
            <div className="flex-1 flex items-end gap-2 relative" style={{ height: `${barHeight}px` }}>
              {/* Horizontal grid lines */}
              {yTicks.map((t, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-dashed border-white/[0.04]"
                  style={{ bottom: `${(t / 100) * barHeight}px` }}
                />
              ))}

              {courses.map((course, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                  {/* Bar stack */}
                  <div className="relative w-full flex justify-center" style={{ height: `${barHeight}px` }}>
                    {/* Ghost / goal bar */}
                    <div
                      className="absolute bottom-0 rounded-t-[8px]"
                      style={{
                        width: '48%',
                        height: '100%',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                      }}
                    />
                    {/* Actual score bar */}
                    <div
                      className="absolute bottom-0 rounded-t-[8px]"
                      style={{
                        width: '48%',
                        height: `${Math.max(course.score, 2)}%`,
                        backgroundColor: course.color,
                        opacity: course.score === 0 ? 0.15 : 1,
                      }}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-[9px] text-muted-foreground/40 font-semibold whitespace-nowrap">
                    {course.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
