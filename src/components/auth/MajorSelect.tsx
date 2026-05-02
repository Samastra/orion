'use client';

import React, { useState, useMemo } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search, GraduationCap, ChevronDown } from "lucide-react";
import { ALL_MAJORS, MAJORS_LIST } from "@/constants/majors";
import { cn } from "@/lib/utils";

interface MajorSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function MajorSelect({ value, onChange, className, placeholder = "Search for your major..." }: MajorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredMajors = useMemo(() => {
    if (!search) return MAJORS_LIST;
    
    const searchLower = search.toLowerCase();
    return MAJORS_LIST.map(category => ({
      ...category,
      majors: category.majors.filter(m => m.toLowerCase().includes(searchLower))
    })).filter(category => category.majors.length > 0);
  }, [search]);

  return (
    <>
      <input type="hidden" name="major" value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full !h-12 justify-between bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/10 rounded-xl px-4 font-normal transition-all text-left focus:ring-2 focus:ring-indigo-500/40",
              !value && "text-muted-foreground/40",
              className
            )}
          >
            <div className="flex items-center gap-3 truncate">
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <span className="truncate text-[13px]">{value || "Select a major"}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0a0a0b] border-white/10 shadow-2xl rounded-2xl overflow-hidden" align="start">
          <div className="flex flex-col h-[400px]">
            <div className="p-3 border-b border-white/5 bg-white/[0.02]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-9 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredMajors.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground/50 italic">
                  No majors found.
                </div>
              ) : (
                filteredMajors.map((group) => (
                  <div key={group.category} className="mb-4 last:mb-0">
                    <h3 className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {group.category}
                    </h3>
                    <div className="space-y-0.5">
                      {group.majors.map((major) => (
                        <button
                          key={major}
                          type="button"
                          onClick={() => {
                            onChange(major);
                            setOpen(false);
                            setSearch("");
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                            value === major 
                              ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          <span className="truncate">{major}</span>
                          {value === major && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
