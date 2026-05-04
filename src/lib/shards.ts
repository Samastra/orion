/**
 * SHARD ENGINE
 * 
 * Server-side utility for managing shard balances.
 * All database interactions go through atomic Supabase RPC functions
 * to prevent race conditions on concurrent requests.
 * 
 * Usage pattern (check-before, deduct-after):
 *   1. checkSufficientShards() → verify balance before AI call
 *   2. ...perform AI generation...
 *   3. deductShards() → charge only after success
 */

import { createClient } from '@/lib/supabase/server';
import { SHARD_COSTS } from '@/constants/shards';

// ─── Types ──────────────────────────────────────────────────────

export interface ShardResult {
  success: boolean;
  balance: number;
  error?: string;
}

export interface ChatShardResult extends ShardResult {
  chatCount: number;
  didDeduct: boolean;
}

// ─── Balance Check ──────────────────────────────────────────────

/**
 * Get the current shard balance for a user.
 */
export async function getShardBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('shard_balance')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('❌ [Shards] Failed to fetch balance:', error);
    return 0;
  }

  return data.shard_balance ?? 0;
}

/**
 * Pre-check if a user has enough shards for an action.
 * Does NOT deduct — use this before sending the AI request.
 */
export async function checkSufficientShards(
  userId: string, 
  requiredAmount: number
): Promise<{ sufficient: boolean; balance: number }> {
  const balance = await getShardBalance(userId);
  return {
    sufficient: balance >= requiredAmount,
    balance,
  };
}

// ─── Deduction (Post-Success) ───────────────────────────────────

/**
 * Deduct shards from a user's balance.
 * Call this AFTER a successful AI generation.
 * Uses an atomic RPC function to prevent race conditions.
 */
export async function deductShards(
  userId: string,
  amount: number,
  reason: string,
  metadata: Record<string, any> = {}
): Promise<ShardResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('deduct_shards', {
    p_user_id: userId,
    p_amount: amount,
    p_type: 'deduction',
    p_reason: reason,
    p_metadata: metadata,
  });

  if (error) {
    console.error('❌ [Shards] Deduction RPC failed:', error);
    return { success: false, balance: 0, error: 'DEDUCTION_FAILED' };
  }

  const result = data as any;
  
  if (!result.success) {
    console.warn(`⚠️ [Shards] Deduction failed for ${userId}: ${result.error}`);
  } else {
    console.log(`💎 [Shards] Deducted ${amount} from ${userId} (${reason}). New balance: ${result.balance}`);
  }

  return {
    success: result.success,
    balance: result.balance,
    error: result.error,
  };
}

// ─── Credit (Purchases & Bonuses) ───────────────────────────────

/**
 * Add shards to a user's balance.
 * Used for purchases, signup bonuses, and refunds.
 */
export async function addShards(
  userId: string,
  amount: number,
  type: 'purchase' | 'signup_bonus' | 'refund',
  reason: string,
  metadata: Record<string, any> = {}
): Promise<ShardResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('add_shards', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_reason: reason,
    p_metadata: metadata,
  });

  if (error) {
    console.error('❌ [Shards] Credit RPC failed:', error);
    return { success: false, balance: 0, error: 'CREDIT_FAILED' };
  }

  const result = data as any;
  console.log(`✅ [Shards] Added ${amount} to ${userId} (${type}: ${reason}). New balance: ${result.balance}`);

  return {
    success: result.success,
    balance: result.balance,
    error: result.error,
  };
}

// ─── Chat Message Tracking ─────────────────────────────────────

/**
 * Increment the chat message counter and deduct 1 shard every N messages.
 * Handles the "1 shard per 5 messages" logic atomically in the database.
 */
export async function trackChatMessage(userId: string): Promise<ChatShardResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('increment_chat_and_maybe_deduct', {
    p_user_id: userId,
    p_messages_per_shard: SHARD_COSTS.chat_messages_per_shard,
  });

  if (error) {
    console.error('❌ [Shards] Chat tracking RPC failed:', error);
    return { success: false, balance: 0, chatCount: 0, didDeduct: false, error: 'TRACKING_FAILED' };
  }

  const result = data as any;
  
  if (result.did_deduct) {
    console.log(`💬 [Shards] Chat bundle deducted for ${userId}. New balance: ${result.balance}`);
  }

  return {
    success: result.success,
    balance: result.balance,
    chatCount: result.chat_count,
    didDeduct: result.did_deduct,
    error: result.error,
  };
}

/**
 * Check if a user can send a chat message.
 * Returns false only if the NEXT message would trigger a deduction
 * AND the user has 0 shards.
 */
export async function canSendChatMessage(userId: string): Promise<{ allowed: boolean; balance: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('shard_balance, chat_messages_since_deduction')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { allowed: false, balance: 0 };
  }

  const nextCount = (data.chat_messages_since_deduction ?? 0) + 1;
  const willDeduct = nextCount >= SHARD_COSTS.chat_messages_per_shard;

  // Allow if: won't deduct this message, OR has enough balance
  return {
    allowed: !willDeduct || data.shard_balance >= 1,
    balance: data.shard_balance,
  };
}
