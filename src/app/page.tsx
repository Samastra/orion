'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { DashboardMobilePreview } from "@/components/landing/DashboardMobilePreview";
import { CompetitorsSection } from "@/components/landing/CompetitorsSection";
import { CoursesSection } from "@/components/landing/CoursesSection";
import { CoursesMobilePreview } from "@/components/landing/CoursesMobilePreview";
import { PracticeSection } from "@/components/landing/PracticeSection";
import { ProgressSection } from "@/components/landing/ProgressSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";



// ─── Dot Grid Background ────────────────────────────────────────
function DotGrid() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="currentColor" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Subtle glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/[0.07] blur-[160px] rounded-full" />
      <div className="absolute top-[25%] right-[20%] w-[250px] h-[250px] bg-violet-600/[0.05] blur-[130px] rounded-full" />
      <div className="absolute top-[30%] left-[15%] w-[200px] h-[200px] bg-indigo-500/[0.04] blur-[100px] rounded-full" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function LandingPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 overflow-x-hidden">
      <DotGrid />

      {/* ─── Navigation (no border, clean) ───────────────────── */}
      <nav className="fixed top-3 w-full z-50">
        <div className="max-w-[1400px] mx-auto px-4">
        <div className="bg-background/70 backdrop-blur-xl rounded-2xl border border-white/[0.04]">
        <div className="px-6 h-13 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/dobbyvisuals/icon app.png" 
              alt="" 
              width={28} 
              height={28} 
              className="w-7 h-7"
            />
            <Image 
              src="/dobbyvisuals/dobby name white.png" 
              alt="Dobby AI" 
              width={100} 
              height={24} 
              className="h-6 w-auto translate-y-[3px]"
              priority
            />
          </Link>

          {/* Nav links — plain text, well spaced */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'Pricing'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `#${item.toLowerCase()}`}
                className={`text-[13px] font-medium transition-colors ${
                  item === 'Home'
                    ? 'text-white/90'
                    : 'text-muted-foreground/40 hover:text-white/70'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Login button — matches app style */}
          <Link href="/login">
            <Button className="h-9 px-5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl font-semibold text-[12px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none">
              Login
            </Button>
          </Link>
        </div>
        </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────── */}
      <main className="pt-28 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 max-w-5xl mx-auto"
            >
              {/* Headline */}
              <h1
                className="font-semibold tracking-tighter text-center"
                style={{
                  fontSize: 'clamp(2.6rem, 10vw, 4rem)',
                  lineHeight: '1.05',
                  letterSpacing: '-0.03em',
                }}
              >
                Study Smarter. Ace Exams.
                <br />
                <span className="bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                  And Still Have Time for Fun.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl mx-auto text-[14px] sm:text-[15px] text-muted-foreground/50 leading-relaxed">
                Dobby is your personal AI study assistant — it reads your notes, teaches you the hard stuff, and quizzes you until you&apos;re ready.
              </p>

              {/* Single CTA */}
              <div>
                <Link href="/login">
                  <Button className="h-11 px-8 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl font-bold gap-2 text-[13px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none group">
                    Get Started Free
                    <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* ─── Majors Marquee ─────────────────────────────── */}
            <div className="mt-12 overflow-hidden relative">
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
                className="flex gap-6 whitespace-nowrap"
              >
                {[
                  'Pharmacy', 'Medicine (MBBS)', 'Computer Science', 'Law', 'Biochemistry',
                  'Mechanical Eng.', 'Architecture', 'Nursing', 'Economics', 'Dentistry',
                  'Electrical Eng.', 'Psychology', 'Microbiology', 'Accounting', 'Civil Eng.',
                  'Anatomy', 'Physiology', 'Chemistry', 'Physics', 'Business Admin',
                  'Pharmacy', 'Medicine (MBBS)', 'Computer Science', 'Law', 'Biochemistry',
                  'Mechanical Eng.', 'Architecture', 'Nursing', 'Economics', 'Dentistry',
                  'Electrical Eng.', 'Psychology', 'Microbiology', 'Accounting', 'Civil Eng.',
                  'Anatomy', 'Physiology', 'Chemistry', 'Physics', 'Business Admin',
                ].map((major, i) => (
                  <span
                    key={i}
                    className="text-[12px] sm:text-[13px] font-medium text-white/[0.12] tracking-wide shrink-0"
                  >
                    {major}
                  </span>
                ))}
              </motion.div>
            </div>


            {/* ─── Dashboard Preview ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="mt-16 max-w-5xl mx-auto relative"
            >
              {/* Glow underneath */}
              <div className="absolute -inset-8 bg-indigo-600/[0.06] blur-[80px] rounded-3xl -z-10" />
              <div className="absolute -inset-4 bg-violet-600/[0.03] blur-[60px] rounded-3xl -z-10" />

              {/* Dashboard */}
              {isDesktop ? (
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_20px_80px_-20px_rgba(99,102,241,0.15)] bg-background">
                  <DashboardPreview />
                </div>
              ) : (
                <DashboardMobilePreview />
              )}

              {/* Fade to background at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </main>

      {/* ─── Competitors Section ─────────────────────────────── */}
      <CompetitorsSection />

      {/* ─── Courses Section ───────────────────────────────── */}
      <CoursesSection />

      {/* ─── Practice Section ──────────────────────────────── */}
      <PracticeSection />

      {/* ─── Progress Section ────────────────────────────────── */}
      <ProgressSection />

      {/* ─── Closing CTA ─────────────────────────────────────── */}
      <section className="relative py-28 sm:py-36 px-6 overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2
              className="font-bold tracking-tighter"
              style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', lineHeight: '1.05' }}
            >
              Don&apos;t let exams catch you slipping.
              <br />
              <span className="text-muted-foreground/30">Use Dobby before UNI takes you.</span>
            </h2>

            <div className="pt-4">
              <Link href="/login">
                <Button className="h-12 px-10 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl font-bold gap-2 text-[14px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none group">
                  Get Started Free
                  <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-35">
            <Image 
              src="/dobbyvisuals/icon app.png" 
              alt="" 
              width={20} 
              height={20} 
              className="w-5 h-5"
            />
            <Image 
              src="/dobbyvisuals/dobby name white.png" 
              alt="Dobby AI" 
              width={80} 
              height={20} 
              className="h-5 w-auto translate-y-[3px]"
            />
          </div>
          <p className="text-[12px] text-muted-foreground/30">
            © 2026 Dobby AI. Built for students who want more from their study time.
          </p>
        </div>
      </footer>
    </div>
  );
}
