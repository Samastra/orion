/**
 * SHARD ICON
 * 
 * Reusable gem/crystal SVG icon used across the shard system.
 * Extracted as a standalone component for consistency — every shard
 * display uses the exact same icon with the same gradient.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ShardIconProps {
  size?: number;
  className?: string;
}

export function ShardIcon({ size = 14, className }: ShardIconProps) {
  // Unique gradient ID to prevent SVG conflicts when multiple icons render
  const gradientId = `shardGrad-${React.useId().replace(/:/g, '')}`;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M12 2L4 8.5L12 22L20 8.5L12 2Z" fill={`url(#${gradientId})`} />
      <path d="M12 2L4 8.5H20L12 2Z" fill="white" fillOpacity="0.25" />
      <path d="M8 8.5L12 22L16 8.5H8Z" fill="white" fillOpacity="0.1" />
    </svg>
  );
}
