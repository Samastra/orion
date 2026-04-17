'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────────
const flashcards = [
  { front: 'What is the primary mechanism of action of Penicillin?', back: 'Penicillin inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), preventing the cross-linking of peptidoglycan chains.', category: 'Pharmacology' },
  { front: 'Define the term "Bioavailability" in pharmacokinetics.', back: 'Bioavailability is the fraction of an administered dose of unchanged drug that reaches the systemic circulation. For IV administration, bioavailability is 100%.', category: 'Pharmacokinetics' },
  { front: 'What are the four lobes of the cerebral cortex?', back: 'Frontal lobe, Parietal lobe, Temporal lobe, and Occipital lobe. Each is responsible for different functions including motor control, sensory processing, auditory processing, and vision respectively.', category: 'Anatomy' },
];

const mcqs = [
  {
    question: 'Which enzyme is primarily responsible for the conversion of Angiotensin I to Angiotensin II?',
    options: ['Renin', 'Angiotensin-Converting Enzyme (ACE)', 'Aldosterone synthase', 'Chymase'],
    correctIndex: 1,
    explanations: [
      'Renin converts angiotensinogen to angiotensin I, not I to II.',
      'ACE converts Angiotensin I to the potent vasoconstrictor Angiotensin II, mainly in the lungs.',
      'Aldosterone synthase is involved in aldosterone production, not angiotensin conversion.',
      'Chymase is an alternative pathway but not the primary enzyme.',
    ],
  },
  {
    question: 'Which of the following is NOT a function of the liver?',
    options: ['Gluconeogenesis', 'Production of insulin', 'Bile acid synthesis', 'Detoxification of drugs'],
    correctIndex: 1,
    explanations: [
      'The liver actively performs gluconeogenesis to maintain blood glucose levels.',
      'Insulin is produced by beta cells of the pancreatic islets of Langerhans, not the liver.',
      'The liver synthesizes bile acids from cholesterol for fat digestion.',
      'The liver is the primary organ for drug metabolism and detoxification via cytochrome P450 enzymes.',
    ],
  },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── Interactive Flashcard ──────────────────────────────────────
function DemoFlashcard({ card, index, total }: { card: typeof flashcards[0]; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">
          Card {index + 1} of {total}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/30 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">
          {card.category}
        </span>
      </div>

      <div
        className="w-full cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full min-h-[280px] transition-all duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl border border-white/[0.08] bg-[#0A0A0B] p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
          >
            <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest mb-4">Question</span>
            <p className="text-[15px] text-white/90 leading-relaxed font-bold">{card.front}</p>
            <div className="mt-8 flex items-center gap-1.5 text-muted-foreground/25">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Tap to reveal</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl border border-indigo-500/20 bg-[#0D0D12] p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)' }}
          >
            <span className="text-[10px] font-semibold text-indigo-400/50 uppercase tracking-widest mb-4">Answer</span>
            <p className="text-[14px] text-white/80 leading-relaxed">{card.back}</p>
            <div className="mt-8 flex items-center gap-1.5 text-indigo-400/20">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-tight">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive MCQ ────────────────────────────────────────────
function DemoMCQ({ question, questionNumber }: { question: typeof mcqs[0]; questionNumber: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
  };

  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">
            Question {questionNumber}
          </span>
          {revealed && (
            <button onClick={handleReset} className="text-[10px] font-medium text-indigo-400/50 hover:text-indigo-400 flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Try again
            </button>
          )}
        </div>
        <p className="text-[15px] text-foreground/90 leading-relaxed font-bold">{question.question}</p>
      </div>

      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;

          let style = 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer active:scale-[0.98] transition-all';

          if (revealed) {
            if (isCorrect) {
              style = 'border-emerald-500/30 bg-emerald-500/10';
            } else if (isSelected && !isCorrect) {
              style = 'border-rose-500/30 bg-rose-500/10';
            } else {
              style = 'border-white/[0.04] bg-white/[0.01] opacity-40';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full flex items-start gap-4 px-4 py-3.5 rounded-2xl border text-left ${style}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black shrink-0 mt-0.5 ${
                revealed && isCorrect
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : revealed && isSelected && !isCorrect
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-white/[0.04] text-muted-foreground/60'
              }`}>
                {revealed && isCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : revealed && isSelected && !isCorrect ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  OPTION_LABELS[i]
                )}
              </span>
              <div className="flex-1 space-y-2">
                <p className={`text-[13px] leading-relaxed ${
                  revealed && isCorrect ? 'text-emerald-300 font-bold' : 'text-foreground/80 font-medium'
                }`}>
                  {option}
                </p>
                {revealed && question.explanations[i] && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[12px] leading-relaxed text-muted-foreground/60 border-t border-white/[0.05] pt-2"
                  >
                    {question.explanations[i]}
                  </motion.p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Section ───────────────────────────────────────────────
export function PracticeSection() {
  const [activeTab, setActiveTab] = useState<'mcq' | 'flashcards'>('mcq');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [mcqIndex, setMcqIndex] = useState(0);

  return (
    <section className="relative py-28 px-6 bg-background overflow-hidden border-t border-white/[0.04]">
      {/* Subtle dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none">
        <defs>
          <pattern id="practice-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="currentColor" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#practice-dots)" />
      </svg>

      {/* Glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/[0.05] blur-[150px] rounded-full -z-0" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4">Smart Practice</p>
          <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.15]">
            Practice that actually
            <br />
            <span className="bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">prepares you.</span>
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground/50 leading-relaxed max-w-lg mx-auto">
            AI-generated MCQs and flashcards pulled directly from your notes. Every question is relevant, every answer is sourced. Try it below.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('mcq')}
              className={`px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === 'mcq'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-muted-foreground/40 hover:text-white/60'
              }`}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-muted-foreground/40 hover:text-white/60'
              }`}
            >
              Flashcards
            </button>
          </div>
        </div>

        {/* Content — dark card container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="max-w-2xl mx-auto rounded-2xl bg-[#0a0a0d] border border-white/[0.08] p-8 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.1)]">
            {activeTab === 'mcq' ? (
              <div>
                <DemoMCQ question={mcqs[mcqIndex]} questionNumber={mcqIndex + 1} />
                {/* Nav */}
                <div className="flex items-center justify-center gap-4 mt-8 pt-5 border-t border-white/[0.05]">
                  <button
                    onClick={() => setMcqIndex(Math.max(0, mcqIndex - 1))}
                    disabled={mcqIndex === 0}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-medium text-muted-foreground/40">
                    {mcqIndex + 1} / {mcqs.length}
                  </span>
                  <button
                    onClick={() => setMcqIndex(Math.min(mcqs.length - 1, mcqIndex + 1))}
                    disabled={mcqIndex === mcqs.length - 1}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <DemoFlashcard card={flashcards[flashcardIndex]} index={flashcardIndex} total={flashcards.length} />
                {/* Nav */}
                <div className="flex items-center justify-center gap-4 mt-8 pt-5 border-t border-white/[0.05]">
                  <button
                    onClick={() => setFlashcardIndex(Math.max(0, flashcardIndex - 1))}
                    disabled={flashcardIndex === 0}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-medium text-muted-foreground/40">
                    {flashcardIndex + 1} / {flashcards.length}
                  </span>
                  <button
                    onClick={() => setFlashcardIndex(Math.min(flashcards.length - 1, flashcardIndex + 1))}
                    disabled={flashcardIndex === flashcards.length - 1}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
