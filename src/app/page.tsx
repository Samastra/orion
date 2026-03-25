'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Brain, GraduationCap, ArrowRight, Upload, MoveRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
      title: "Universal Reader",
      description: "Seamlessly read PDF, PPTX, and Word documents with a high-fidelity viewing experience."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-violet-400" />,
      title: "Contextual AI Chat",
      description: "Chat with an AI that understands the specific page and context you are currently studying."
    },
    {
      icon: <Brain className="w-6 h-6 text-rose-400" />,
      title: "Smart Quizzes",
      description: "Instantly generate flashcards and multiple-choice questions from your course materials."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyBuddy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#courses" className="hover:text-foreground transition-colors">Courses</Link>
            <Link href="/login" className="px-5 py-2.5 bg-white text-black rounded-full hover:bg-neutral-200 transition-all font-semibold">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -z-10" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text- indigo-300 animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                New: AI Flashcard Generator
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1]">
                Master your courses <br />
                <span className="gradient-text">with AI intelligence.</span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
                The all-in-one study companion that reads your documents, answers your questions, and tests your knowledge. Built for the modern student.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-bold flex items-center justify-center gap-2 group shadow-2xl shadow-indigo-500/20">
                  Try it now
                  <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="w-full sm:w-auto px-8 py-4 glass text-white rounded-2xl hover:bg-white/10 transition-all font-semibold flex items-center justify-center gap-2">
                  View Demo
                </button>
              </div>
            </motion.div>

            {/* Feature Grid */}
            <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 rounded-3xl glass hover:bg-white/5 transition-all group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </section>

            {/* Upload Teaser */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-32 p-12 rounded-[40px] bg-gradient-to-b from-indigo-600/10 to-transparent border border-indigo-500/20 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Upload className="text-indigo-400 w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold">Ready to start studying?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Connect your Google Drive or upload your course materials (PDF, PPTX, DOCX) to begin your interactive learning journey.
              </p>
              <button className="mt-4 px-10 py-4 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-all font-bold">
                Drop your files here
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">StudyBuddy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 StudyBuddy AI. Premium learning for a modern world.
          </p>
        </div>
      </footer>
    </div>
  );
}
