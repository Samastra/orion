/**
 * SHARD SYSTEM CONFIGURATION
 * 
 * Centralized configuration for the shard virtual currency system.
 * All shard costs, pack definitions, and signup bonuses are defined here
 * for easy tweaking without touching any component or API logic.
 */

// ─── Shard Costs Per Action ────────────────────────────────────────

export const SHARD_COSTS = {
  /** Cost per MCQ question generated */
  mcq: 1,
  /** Cost per flashcard generated */
  flashcard: 1,
  /** Cost per chat message bundle (see chat_messages_per_shard) */
  chat_bundle: 1,
  /** Number of chat messages before 1 shard is deducted */
  chat_messages_per_shard: 5,
} as const;

// ─── Shard Packs (Purchasable) ─────────────────────────────────────

export interface ShardPack {
  id: string;
  name: string;
  emoji: string;
  shards: number;
  price: number;
  badge: string | null;
}

export const SHARD_PACKS: readonly ShardPack[] = [
  { id: 'trial',    name: 'Trial',    emoji: '🧪', shards: 50,    price: 0.49, badge: null },
  { id: 'starter',  name: 'Starter',  emoji: '⚡', shards: 200,   price: 0.99, badge: null },
  { id: 'basic',    name: 'Basic',    emoji: '🔥', shards: 500,   price: 1.99, badge: null },
  { id: 'standard', name: 'Standard', emoji: '💎', shards: 1500,  price: 3.99, badge: null },
  { id: 'plus',     name: 'Plus',     emoji: '🌟', shards: 5000,  price: 6.99, badge: 'Best Value' },
  { id: 'premium',  name: 'Premium',  emoji: '👑', shards: 15000, price: 9.99, badge: null },
] as const;

// ─── Signup Bonus ──────────────────────────────────────────────────

/** Free shards given to every new user at signup */
export const SIGNUP_BONUS_SHARDS = 200;

// ─── Utility Helpers ───────────────────────────────────────────────

/**
 * Calculate the shard cost for a practice generation.
 * @param type - 'mcq' or 'flashcard'
 * @param count - Number of items to generate
 */
export function calculatePracticeCost(type: 'mcq' | 'flashcard', count: number): number {
  return count * SHARD_COSTS[type];
}

/**
 * Check if a chat message triggers a shard deduction.
 * @param messageIndex - The 0-based index of the current message in the rolling window
 * @returns true if this message should trigger a deduction
 */
export function shouldDeductChatShard(messageCount: number): boolean {
  return messageCount > 0 && messageCount % SHARD_COSTS.chat_messages_per_shard === 0;
}
