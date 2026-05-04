'use client';

/**
 * SHARD PURCHASE MODAL
 * 
 * Game-style shard shop modal. Appears when:
 * 1. User doesn't have enough shards for an action
 * 2. User clicks their shard balance in the sidebar
 * 
 * Displays all 6 shard packs in a 2×3 grid with pricing,
 * "Best Value" badges, and purchase CTAs.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShardIcon } from './ShardIcon';
import { useShards } from './ShardBalanceProvider';
import { SHARD_PACKS, type ShardPack } from '@/constants/shards';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface ShardPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, shows "You need X more shards" */
  requiredShards?: number;
}

export function ShardPurchaseModal({ open, onOpenChange, requiredShards }: ShardPurchaseModalProps) {
  const { balance, refreshBalance } = useShards();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const deficit = requiredShards ? Math.max(0, requiredShards - balance) : 0;

  const handlePurchase = async (pack: ShardPack) => {
    setPurchasingId(pack.id);
    try {
      const res = await fetch('/api/shards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      });

      if (res.ok) {
        const data = await res.json();
        await refreshBalance();
        toast.success(`+${pack.shards.toLocaleString()} shards added!`, {
          description: `New balance: ${data.balance.toLocaleString()} shards`,
        });
        onOpenChange(false);
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } catch (err) {
      toast.error('Connection error. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden bg-[#0a0a0b] border-white/[0.08] shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Get Shards</DialogTitle>
        <DialogDescription className="sr-only">
          Purchase shard packs to use AI features.
        </DialogDescription>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] bg-gradient-to-b from-indigo-500/[0.06] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShardIcon size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-white">Get Shards</h2>
                <p className="text-[11px] text-muted-foreground/50 font-medium">
                  Power your AI study sessions
                </p>
              </div>
            </div>

            {/* Balance + deficit inline */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <ShardIcon size={11} />
                <span className="text-[11px] font-bold text-white/80 tabular-nums">{balance.toLocaleString()}</span>
              </div>
              {deficit > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <Sparkles className="w-3 h-3 text-rose-400/70" />
                  <span className="text-[11px] font-semibold text-rose-400/80">
                    Need {deficit.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pack Grid — 3 columns, compact */}
        <div className="p-4 grid grid-cols-3 gap-2.5">
          {SHARD_PACKS.map((pack) => {
            const isPurchasing = purchasingId === pack.id;
            const meetsDeficit = deficit > 0 && pack.shards >= deficit;
            
            return (
              <button
                key={pack.id}
                onClick={() => handlePurchase(pack)}
                disabled={isPurchasing || purchasingId !== null}
                className={cn(
                  'relative flex flex-col items-center px-3 py-3 rounded-xl border transition-all group text-center',
                  'hover:bg-white/[0.04] hover:border-indigo-500/30 active:scale-[0.97]',
                  meetsDeficit
                    ? 'bg-indigo-500/[0.04] border-indigo-500/20 ring-1 ring-indigo-500/10'
                    : 'bg-white/[0.02] border-white/[0.06]',
                  isPurchasing && 'opacity-70 pointer-events-none'
                )}
              >
                {/* Badge */}
                {pack.badge && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-[8px] font-bold text-white uppercase tracking-wider whitespace-nowrap border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                    {pack.badge}
                  </div>
                )}

                {/* Emoji */}
                <span className="text-xl mb-1">{pack.emoji}</span>

                {/* Shard amount */}
                <div className="flex items-center gap-1 mb-0.5">
                  <ShardIcon size={12} />
                  <span className="text-[16px] font-black text-white tabular-nums">
                    {pack.shards.toLocaleString()}
                  </span>
                </div>

                {/* Pack name */}
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">
                  {pack.name}
                </span>

                {/* Price button */}
                <div className={cn(
                  'w-full py-1.5 rounded-lg text-[12px] font-bold transition-all',
                  meetsDeficit
                    ? 'bg-indigo-600 text-white group-hover:bg-indigo-500'
                    : 'bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1] group-hover:text-white'
                )}>
                  {isPurchasing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    `$${pack.price.toFixed(2)}`
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 -mt-1">
          <p className="text-[10px] text-center text-muted-foreground/25 leading-relaxed">
            Shards never expire. 1 shard = 1 question or flashcard generated.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

