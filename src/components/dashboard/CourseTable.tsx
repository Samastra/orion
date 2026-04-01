'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import {
  MoreHorizontal,
  Plus,
  CircleDot,
  BookOpen,
  Calendar
} from "lucide-react";
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPerformanceData } from "@/lib/supabase/actions";
import { PerformanceChart } from "./PerformanceChart";

export function CourseTable() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("outline");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) setCourses(data || []);
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const handleTabChange = async (value: string) => {
    setTab(value);
    if (value === "performance" && performanceData.length === 0) {
      setPerfLoading(true);
      const { data, error } = await getPerformanceData();
      if (!error && data) setPerformanceData(data);
      setPerfLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="outline" onValueChange={handleTabChange} className="w-auto">
          <TabsList className="bg-white/5 border border-white/5 h-10 p-1 rounded-xl">
            <TabsTrigger value="outline" className="rounded-lg px-4 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">Recent Courses</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg px-4 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">Performance</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/courses">
            <Button size="sm" className="h-10 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none">
              <Plus className="w-4 h-4 mr-2" />
              Manage All
            </Button>
          </Link>
        </div>
      </div>

      {tab === "outline" ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-muted-foreground font-medium">Course Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Subject</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date Added</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell colSpan={6} className="h-16 bg-white/[0.01]" />
                  </TableRow>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.id} className="border-white/5 hover:bg-white/[0.04] group transition-colors">
                    <TableCell className="w-[40px] py-4">
                      <BookOpen className="w-4 h-4 text-muted-foreground/30 group-hover:text-indigo-400 transition-colors" />
                    </TableCell>
                    <TableCell className="font-semibold py-4">
                      <Link href={`/dashboard/courses`} className="hover:text-indigo-400 transition-colors">
                        {course.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="max-w-[150px] truncate block rounded-full bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-medium px-3">
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        {new Date(course.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <CircleDot className="w-4 h-4 text-indigo-400" />
                        <span className="text-muted-foreground text-sm">Active</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No courses found. Start by adding one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <PerformanceChart data={performanceData} loading={perfLoading} />
      )}
    </div>
  );
}

