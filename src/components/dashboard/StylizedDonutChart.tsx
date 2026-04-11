'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
} from 'recharts';
import { motion } from 'framer-motion';

interface StylizedDonutChartProps {
  score: number;
  totalQuestions: number;
}

export function StylizedDonutChart({ score, totalQuestions }: StylizedDonutChartProps) {
  // Mastery tiers based on score
  const data = [
    { name: 'Mastered', value: score, color: 'url(#colorMastered)' }, 
    { name: 'Remaining', value: 100 - score, color: 'rgba(255, 255, 255, 0.03)' }
  ];

  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="colorMastered" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={1} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={95}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
            cornerRadius={40}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  filter: index === 0 ? 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.5))' : 'none',
                  outline: 'none'
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
           initial={{ opacity: 0, scale: 0.5 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3, type: 'spring', damping: 15 }}
           className="text-center"
        >
          <span className="text-4xl font-black text-white tracking-tighter">
            {score}<span className="text-lg font-bold text-indigo-400/60 ml-0.5">%</span>
          </span>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">
            Mastery
          </p>
        </motion.div>
      </div>

      {/* Decorative Outer Ring */}
      <div className="absolute inset-0 rounded-full border border-white/[0.03] scale-[1.05]" />
    </div>
  );
}

export function DonutStatsLegend({ score, totalQuestions }: { score: number, totalQuestions: number }) {
  const tiers = [
    { label: 'Completion', value: score, color: 'bg-indigo-500', sub: `${totalQuestions} Questions` },
    { label: 'Accuracy', value: Math.min(score + 5, 100), color: 'bg-emerald-500', sub: 'Performance' },
    { label: 'Retention', value: Math.max(score - 10, 0), color: 'bg-rose-500', sub: 'Recall Rate' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 w-full mt-8">
      {tiers.map((tier, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-2.5 h-2.5 rounded-full ${tier.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
               <p className="text-[12px] font-bold text-foreground/70 tracking-tight">{tier.label}</p>
            </div>
            <span className="text-[12px] font-black text-foreground/90 tracking-tighter">{tier.value}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${tier.value}%` }}
               transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
               className={`absolute top-0 left-0 h-full ${tier.color} rounded-full`}
             />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
