'use client';

import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  name?: string;
}

const YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
  "Postgraduate"
];

export function YearSelect({ value, onChange, className, name = "academicYear" }: YearSelectProps) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "w-full !h-12 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/10 rounded-xl px-4 text-[13px] font-normal transition-all focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30",
            !value && "text-muted-foreground/40",
            className
          )}
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <SelectValue placeholder="Select Year" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#0a0a0b] border-white/10 rounded-xl shadow-2xl">
          {YEARS.map((year) => (
            <SelectItem 
              key={year} 
              value={year}
              className="rounded-lg focus:bg-white/5 focus:text-indigo-400 transition-colors"
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
