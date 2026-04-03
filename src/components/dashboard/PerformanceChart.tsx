'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from "@/lib/utils";

interface PerformanceData {
  name: string;
  score: number;
  totalQuestions: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0b] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">
            {payload[0].value}% <span className="text-[10px] text-muted-foreground font-medium uppercase font-sans ml-1">Score</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-medium italic">
            Based on {payload[0].payload.totalQuestions} first-time questions
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const GHOST_DATA = [
  { name: 'Anatomy', score: 85, totalQuestions: 0 },
  { name: 'History', score: 65, totalQuestions: 0 },
  { name: 'Physics', score: 45, totalQuestions: 0 },
  { name: 'Literature', score: 90, totalQuestions: 0 },
  { name: 'Biology', score: 70, totalQuestions: 0 },
];

export function PerformanceChart({ data, loading }: PerformanceChartProps) {
  const isGhost = !data || data.length === 0;
  const chartData = isGhost ? GHOST_DATA : data;

  if (loading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
        <div className="flex flex-col items-center gap-3 opacity-30">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-widest">Syncing Progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full bg-white/[0.01] rounded-2xl border border-white/5 p-6 animate-in fade-in zoom-in duration-500 relative group">
      {isGhost && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/5 overflow-hidden rounded-2xl backdrop-blur-[2px]">
           <div className="text-center space-y-2 translate-y-4">
              <p className="text-sm font-bold text-foreground tracking-tight">Your Mastery Journey Starts Here</p>
              <p className="text-[11px] text-muted-foreground/60 max-w-[240px] leading-relaxed mx-auto">
                No courses found. Create a course and start practicing to see your analytics.
              </p>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 px-2">
        <div className={cn(isGhost && "opacity-20 transition-opacity")}>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Course Mastery</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Based on your first-time MCQ attempts only</p>
        </div>
        {!isGhost && (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20" />
                <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">Mastery Goal (100)</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Average Score</span>
             </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height="80%" className={cn(isGhost && "opacity-10 grayscale-[0.5] transition-all")}>
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          barSize={45}
        >
          <CartesianGrid 
            vertical={false} 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.03)" 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          {!isGhost && (
            <Tooltip 
              cursor={{ fill: 'rgba(129, 140, 248, 0.05)', radius: 12 }} 
              content={<CustomTooltip />} 
            />
          )}
          <Bar 
            dataKey="score" 
            radius={[10, 10, 0, 0]}
            background={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
            isAnimationActive={!isGhost}
            animationDuration={1500}
            animationEasing="ease-out"
            stroke={isGhost ? 'rgba(255,255,255,0.1)' : 'transparent'}
            strokeDasharray={isGhost ? '4 4' : '0'}
          >
            {chartData.map((entry: any, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={isGhost ? 'rgba(255,255,255,0.05)' : entry.score >= 90 ? '#10b981' : entry.score >= 70 ? '#6366f1' : entry.score >= 50 ? '#f59e0b' : entry.score === 0 ? 'rgba(255,255,255,0.02)' : '#ef4444'} 
                fillOpacity={isGhost ? 0.2 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
