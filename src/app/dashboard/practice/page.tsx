'use client';

import React, { useState } from 'react';
import { MOCK_COURSES, Course } from '@/lib/mock-courses';
import { PracticeView } from '@/components/practice/PracticeView';
import { 
  BookOpen, 
  Target, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PracticePage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCourses = MOCK_COURSES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCourse) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCourse(null)}
              className="h-9 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-[12px] font-medium transition-all"
            >
              ← Back to Courses
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">{selectedCourse.name}</h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">{selectedCourse.type}</p>
            </div>
          </div>
        </div>

        {/* Practice View Container */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <PracticeView context={selectedCourse.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Practice Arena</h1>
        <p className="text-muted-foreground text-base">Select a course to test your knowledge with MCQs and Flashcards.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          <Input 
            placeholder="Filter by course name or subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/5 focus-visible:ring-indigo-500/30 rounded-xl h-10 text-[13px]"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 h-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-600/20 text-indigo-400' : 'text-muted-foreground/50 hover:text-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('list')}
            className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-indigo-600/20 text-indigo-400' : 'text-muted-foreground/50 hover:text-foreground'}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredCourses.map((course) => (
          <div 
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            className={`
              group relative cursor-pointer
              ${viewMode === 'grid' 
                ? "bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300" 
                : "flex items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300"}
            `}
          >
            {/* Visual indication of progress/status */}
            <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <Target className="w-5 h-5 text-indigo-400" />
            </div>

            <div className={viewMode === 'grid' ? "space-y-4" : "flex-1 flex items-center justify-between"}>
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                  {course.type}
                </span>
                <h3 className="text-[17px] font-bold tracking-tight text-foreground/90 group-hover:text-indigo-400 transition-colors">
                  {course.name}
                </h3>
                {viewMode === 'grid' && (
                  <p className="text-[12px] text-muted-foreground/40 leading-relaxed line-clamp-2">
                    {course.content}
                  </p>
                )}
              </div>

              <div className={viewMode === 'grid' ? "pt-4 flex items-center justify-between border-t border-white/[0.04]" : "flex items-center gap-8"}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">92% Average</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Last session: 2d ago</span>
                  </div>
                </div>
                {viewMode === 'grid' ? (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                ) : (
                  <Button variant="ghost" className="rounded-xl hover:bg-indigo-600 hover:text-white gap-2 text-[12px] font-medium">
                    Start Session <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
