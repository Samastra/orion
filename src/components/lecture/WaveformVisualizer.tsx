'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * WAVEFORM VISUALIZER
 * 
 * Premium canvas-based circular audio visualizer.
 * - Bars radiate from center, reacting to real-time frequency data
 * - Indigo/purple color scheme matching the app's design language
 * - Pulsing glow effect when audio detected
 * - Smooth idle animation when paused or silent
 */

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  isPaused: boolean;
  className?: string;
}

const BAR_COUNT = 64;
const IDLE_AMPLITUDE = 0.15;

export function WaveformVisualizer({ 
  analyserNode, 
  isRecording, 
  isPaused,
  className 
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const maxBarHeight = Math.min(width, height) * 0.2;

    timeRef.current += 0.016; // ~60fps

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Get frequency data
    let dataArray: Uint8Array | null = null;
    if (analyserNode && isRecording && !isPaused) {
      dataArray = new Uint8Array(analyserNode.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      analyserNode.getByteFrequencyData(dataArray);
    }

    // ─── Outer Glow Ring ──────────────────────────────────────
    const avgVolume = dataArray 
      ? dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255 
      : 0;

    const glowIntensity = isPaused ? 0.05 : Math.max(0.05, avgVolume * 0.6);
    const pulseScale = 1 + Math.sin(timeRef.current * 2) * 0.02;

    // Outer glow ring
    const gradient = ctx.createRadialGradient(
      centerX, centerY, baseRadius * 0.8,
      centerX, centerY, baseRadius + maxBarHeight * 1.5
    );
    gradient.addColorStop(0, `rgba(99, 102, 241, ${glowIntensity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(139, 92, 246, ${glowIntensity * 0.15})`);
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, (baseRadius + maxBarHeight * 1.5) * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // ─── Center Circle ────────────────────────────────────────
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseRadius * 0.9
    );
    innerGradient.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    innerGradient.addColorStop(1, 'rgba(99, 102, 241, 0.04)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // Inner circle border
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = isPaused 
      ? 'rgba(255, 255, 255, 0.06)' 
      : `rgba(99, 102, 241, ${0.15 + avgVolume * 0.2})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // ─── Circular Bars ────────────────────────────────────────
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;

      let barHeight: number;
      if (dataArray && isRecording && !isPaused) {
        // Map bar index to frequency bin
        const freqIndex = Math.floor((i / BAR_COUNT) * dataArray.length * 0.6);
        const value = dataArray[freqIndex] / 255;
        barHeight = maxBarHeight * Math.max(0.04, value);
      } else {
        // Idle breathing animation
        const idleWave = Math.sin(timeRef.current * 1.5 + (i / BAR_COUNT) * Math.PI * 4);
        const idleWave2 = Math.sin(timeRef.current * 0.8 + (i / BAR_COUNT) * Math.PI * 2);
        barHeight = maxBarHeight * IDLE_AMPLITUDE * (0.5 + 0.3 * idleWave + 0.2 * idleWave2);
      }

      const startX = centerX + Math.cos(angle) * baseRadius;
      const startY = centerY + Math.sin(angle) * baseRadius;
      const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

      // Color gradient per bar (indigo → violet)
      const hue = 240 + (i / BAR_COUNT) * 30;
      const saturation = 70 + (barHeight / maxBarHeight) * 20;
      const lightness = 55 + (barHeight / maxBarHeight) * 15;
      const alpha = isPaused ? 0.2 : 0.3 + (barHeight / maxBarHeight) * 0.5;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.lineWidth = Math.max(1.5, (width / BAR_COUNT) * 0.3);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // ─── Center Icon ──────────────────────────────────────────
    // Mic icon in the center
    const iconSize = baseRadius * 0.3;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = isPaused 
      ? 'rgba(255, 255, 255, 0.2)' 
      : `rgba(99, 102, 241, ${0.5 + avgVolume * 0.4})`;
    ctx.font = `${iconSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPaused ? '⏸' : '🎙', 0, 0);
    ctx.restore();

    animationRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isRecording, isPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: '400px', maxHeight: '400px' }}
      />
    </div>
  );
}
