'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const competitors = [
  { name: 'ChatGPT', logo: '/competitors/63c52af590250dd34bd6a9ab.png' },
  { name: 'Claude', logo: '/competitors/66af99839e55f1ee29f117ac.png' },
  { name: 'Gemini', logo: '/competitors/66afd96f19a3a73a2c337823.png' },
];

export function CompetitorsSection() {
  const [radius, setRadius] = React.useState(115);

  React.useEffect(() => {
    const handleResize = () => {
      setRadius(window.innerWidth < 640 ? 95 : 115);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="relative py-28 px-6 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24 sm:mb-20 max-w-2xl mx-auto"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-4">Why Switch?</p>
          <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight text-gray-900 leading-[1.15]">
            They&apos;re general purpose.
            <br />
            <span className="text-gray-400">Not built for studying.</span>
          </h2>
          <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-lg mx-auto">
            You&apos;re paying $20/month for AI that wasn&apos;t designed for your coursework. Dobby was built from the ground up as your personal study engine.
          </p>
        </motion.div>

        {/* Visual: Competitors → Arrow → Dobby */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20"
        >
          {/* ─── Competitors (static, no orbit) ───────────── */}
          <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] shrink-0">
            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-gray-200" />
            <div className="absolute inset-8 rounded-full border border-gray-100" />

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">General AI</span>
            </div>

            {/* Static logos — positioned around the circle */}
            {competitors.map((comp, i) => {
              const angle = (i * 120 - 90) * (Math.PI / 180);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={comp.name}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div className="w-[52px] h-[52px] rounded-2xl bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex items-center justify-center">
                    <Image
                      src={comp.logo}
                      alt={comp.name}
                      width={30}
                      height={30}
                      className="w-[30px] h-[30px] object-contain"
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 text-center mt-2 whitespace-nowrap">{comp.name}</p>
                </div>
              );
            })}
          </div>

          {/* ─── Arrow ────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.3)]">
              {/* Diagonal on mobile (Dobby is below), horizontal on desktop (Dobby is to the right) */}
              <ArrowDown className="w-4 h-4 text-white md:hidden" />
              <ArrowRight className="w-4 h-4 text-white hidden md:block" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">Switch to</span>
          </div>

          {/* ─── Dobby AI ─────────────────────────────────── */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-12 bg-indigo-500/[0.05] blur-[50px] rounded-full" />

            <div className="relative flex flex-col items-center gap-5">
              {/* Logo */}
              <Image 
                src="/dobbyvisuals/icon app.png" 
                alt="Dobby Icon" 
                width={64} 
                height={64} 
                className="w-16 h-16 object-contain shadow-[0_12px_40px_rgba(99,102,241,0.2)]"
              />
              <div className="text-center">
                <Image 
                  src="/dobbyvisuals/dobby name -blue.png" 
                  alt="Dobby AI" 
                  width={120} 
                  height={30} 
                  className="h-8 w-auto mx-auto translate-y-[3px]"
                />
                <p className="text-[13px] text-gray-500 font-medium mt-2">Purpose-built for students</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Bottom comparison cards ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { them: '$20/mo for generic AI', us: 'Free. Built for your notes.' },
            { them: 'No quiz generation', us: 'MCQs & flashcards from your PDFs' },
            { them: 'Forgets your context', us: 'Remembers every lecture' },
          ].map((item, i) => (
            <div
              key={i}
              className="px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200/80"
            >
              <p className="text-[12px] font-medium text-gray-400 line-through decoration-gray-300">{item.them}</p>
              <p className="text-[15px] font-bold text-gray-800 mt-1.5">{item.us}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
