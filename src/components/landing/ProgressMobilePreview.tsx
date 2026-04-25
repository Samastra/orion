import React from 'react';
import { BookOpen, X, Trophy } from 'lucide-react';

// Static mock of the CourseStatsDrawer (mobile bottom sheet view)
export function ProgressMobilePreview() {
  const score = 89;
  const tiers = [
    { label: 'Completion', value: 89, color: 'bg-indigo-500', barColor: '#6366f1' },
    { label: 'Accuracy', value: 94, color: 'bg-emerald-500', barColor: '#10b981' },
    { label: 'Retention', value: 79, color: 'bg-rose-500', barColor: '#f43f5e' },
  ];

  // SVG donut chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-background w-full max-w-[340px] mx-auto rounded-[32px] overflow-hidden border border-white/[0.08] aspect-[9/19] flex flex-col relative select-none text-left">
      {/* Simulated content behind the drawer */}
      <div className="flex-1 bg-background/50" />

      {/* ─── Bottom Sheet ──────────────────────────────── */}
      <div className="bg-[#0D0D12] border-t border-white/[0.08] rounded-t-[32px] flex flex-col" style={{ height: '88%' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1.5">
          <div className="w-10 h-1.5 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">PCH 201</h2>
              <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Pharmaceutical Chemistry</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-muted-foreground/40">
            <X className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2 custom-scrollbar">
          <div className="space-y-8">
            {/* Donut Chart */}
            <div className="relative w-full aspect-square max-w-[190px] mx-auto">
              {/* Decorative outer ring */}
              <div className="absolute inset-0 rounded-full border border-white/[0.03] scale-[1.06]" />

              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="18"
                />
                {/* Score ring */}
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke="url(#donutGradient)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.5))' }}
                />
                <defs>
                  <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white tracking-tighter">
                  {score}<span className="text-lg font-bold text-indigo-400/60 ml-0.5">%</span>
                </span>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">
                  Mastery
                </p>
              </div>
            </div>

            {/* Progress Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Progress Breakdown</h3>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                  Avg Index <Trophy className="w-3 h-3" />
                </div>
              </div>

              {tiers.map((tier, i) => (
                <div key={i} className="flex flex-col gap-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                      <p className="text-[11px] font-bold text-foreground/70 tracking-tight">{tier.label}</p>
                    </div>
                    <span className="text-[11px] font-black text-foreground/90 tracking-tighter">{tier.value}%</span>
                  </div>
                  <div className="relative h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ width: `${tier.value}%`, backgroundColor: tier.barColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
