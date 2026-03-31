'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Trash2, MoreVertical, LayoutGrid, List as ListIcon, GraduationCap, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
}
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { createCourse, deleteCourse } from '@/lib/supabase/actions';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setCourses(data || []);
    setLoading(false);
  };

  const handleCreateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCourse(formData);
    
    if (result.data) {
      setCourses([result.data, ...courses]);
      setIsModalOpen(false);
    }
    setIsCreating(false);
  };

  const handleDeleteCourse = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteCourse(id);
    if (result.success) {
      setCourses(courses.filter((c: Course) => c.id !== id));
    }
    setIsDeleting(null);
  };

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground text-lg">Manage your academic subjects and study materials.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-6 font-bold gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
        >
          <Plus className="w-4 h-4" />
          New Course
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Course Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course: Course) => (
              <Link 
                key={`${course.id}-${viewMode}`}
                href={`/dashboard/courses/${course.id}`}
                className="block group"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={viewMode === 'grid' 
                    ? "relative bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] transition-all hover:border-indigo-500/30 overflow-hidden h-full flex flex-col"
                    : "flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all"
                  }
                >
                  <div className={viewMode === 'grid' ? "w-full flex-1" : "flex-1 flex items-center justify-between min-w-0"}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors truncate">{course.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">{course.type}</span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${course.type === 'Pharmacy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                    
                    {viewMode === 'grid' && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-4 leading-relaxed">
                        {course.description || "No description provided."}
                      </p>
                    )}
                  </div>

                  <div className={viewMode === 'grid' ? "pt-4 flex items-center justify-between mt-6 border-t border-white/5" : "flex items-center gap-4 ml-8"}>
                    <span className="text-[10px] text-muted-foreground/50 font-medium">Added {new Date(course.created_at).toLocaleDateString()}</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteCourse(course.id);
                      }}
                      disabled={isDeleting === course.id}
                      className="p-2 rounded-xl text-muted-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/del"
                    >
                      {isDeleting === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
          <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">No courses yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Create your first course to start organizing your study materials.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
          >
            Add your first course
          </Button>
        </div>
      )}

      {/* Create Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 z-[60] shadow-2xl"
            >
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">New Course</h2>
                  <p className="text-muted-foreground text-sm">Organize your study materials by creating a new subject.</p>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">Course Code</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. ANA 201"
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">Subject / Major</label>
                    <input
                      name="type"
                      required
                      placeholder="e.g. Pharmacy"
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">Description (Optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="What is this course about?"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-white/5 font-bold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Course'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
