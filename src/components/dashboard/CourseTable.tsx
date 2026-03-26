'use client';

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Settings2,
  GripVertical,
  CircleDot,
  CheckCircle2,
  Clock,
  User2
} from "lucide-react";
import Link from 'next/link';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const data = [
  {
    id: "1",
    name: "Advanced Calculus",
    type: "Mathematics",
    status: "In Process",
    target: 18,
    limit: 5,
    reviewer: "Dr. Aris",
  },
  {
    id: "2",
    name: "Modern Physics",
    type: "Science",
    status: "Done",
    target: 29,
    limit: 24,
    reviewer: "Prof. Klein",
  },
  {
    id: "3",
    name: "organic Chemistry II",
    type: "Science",
    status: "Done",
    target: 10,
    limit: 13,
    reviewer: "Dr. Smith",
  },
  {
    id: "4",
    name: "Algorithms & Complexity",
    type: "Computer Science",
    status: "Done",
    target: 27,
    limit: 23,
    reviewer: "Prof. Turing",
  },
  {
    id: "5",
    name: "Neural Networks",
    type: "AI & ML",
    status: "In Process",
    target: 2,
    limit: 16,
    reviewer: "Dr. Hinton",
  },
];

export function CourseTable() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="outline" className="w-auto">
          <TabsList className="bg-white/5 border border-white/5 h-10 p-1 rounded-xl">
            <TabsTrigger value="outline" className="rounded-lg px-4 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">Outline</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg px-4 data-[state=active]:bg-white/10">Past Performance <Badge variant="secondary" className="ml-2 bg-white/10 text-[10px] h-4 min-w-4 p-0 flex items-center justify-center">3</Badge></TabsTrigger>
            <TabsTrigger value="personnel" className="rounded-lg px-4 data-[state=active]:bg-white/10">Key Personnel <Badge variant="secondary" className="ml-2 bg-white/10 text-[10px] h-4 min-w-4 p-0 flex items-center justify-center">2</Badge></TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg px-4 data-[state=active]:bg-white/10">Focus Documents</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-white/5 bg-white/5 hover:bg-white/10">
            <Settings2 className="w-4 h-4 mr-2" />
            Customize Columns
          </Button>
          <Button size="sm" className="h-10 px-4 rounded-xl bg-white text-black hover:bg-neutral-200">
            <Plus className="w-4 h-4 mr-2 font-bold" />
            Add Section
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[40px]"><Checkbox /></TableHead>
              <TableHead className="text-muted-foreground font-medium">Header</TableHead>
              <TableHead className="text-muted-foreground font-medium">Section Type</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Target</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Limit</TableHead>
              <TableHead className="text-muted-foreground font-medium">Reviewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((course) => (
              <TableRow key={course.id} className="border-white/5 hover:bg-white/[0.04] group transition-colors">
                <TableCell className="w-[40px] py-4">
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab" />
                </TableCell>
                <TableCell className="w-[40px] py-4">
                  <Checkbox />
                </TableCell>
                <TableCell className="font-semibold py-4">
                  <Link href={`/study/${course.name.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-indigo-400 transition-colors">
                    {course.name}
                  </Link>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 font-medium px-3">
                    {course.type}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    {course.status === "Done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CircleDot className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className={course.status === "Done" ? "text-emerald-500/90" : "text-muted-foreground"}>
                      {course.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4 font-mono text-muted-foreground">{course.target}</TableCell>
                <TableCell className="text-right py-4 font-mono text-muted-foreground">{course.limit}</TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                      <User2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-sm">{course.reviewer}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
