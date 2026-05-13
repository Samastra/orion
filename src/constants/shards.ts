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
  /** Shards per minute of lecture audio recorded (covers Deepgram cost) */
  lecture_recording_per_minute: 2,
  /** Flat fee for AI transformation of transcript into study notes */
  lecture_transform: 10,
} as const;

// ─── Shard Packs (Purchasable) ─────────────────────────────────────

export interface ShardPack {
  id: string;
  name: string;
  shards: number;
  price: number;
  badge: string | null;
}

export const SHARD_PACKS: readonly ShardPack[] = [
  { id: 'trial',    name: 'Trial',    shards: 50,    price: 0.49, badge: null },
  { id: 'starter',  name: 'Starter',  shards: 200,   price: 0.99, badge: null },
  { id: 'basic',    name: 'Basic',    shards: 500,   price: 1.99, badge: null },
  { id: 'standard', name: 'Standard', shards: 1500,  price: 3.99, badge: null },
  { id: 'plus',     name: 'Plus',     shards: 5000,  price: 6.99, badge: 'Best Value' },
  { id: 'premium',  name: 'Premium',  shards: 15000, price: 9.99, badge: null },
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

/**
 * Calculate the total shard cost for a lecture recording + transformation.
 * @param durationSeconds - Total recording duration in seconds
 * @returns Object with recording cost, transform cost, and total
 */
export function calculateLectureCost(durationSeconds: number): {
  recordingCost: number;
  transformCost: number;
  totalCost: number;
} {
  const minutes = Math.ceil(durationSeconds / 60);
  const recordingCost = minutes * SHARD_COSTS.lecture_recording_per_minute;
  const transformCost = SHARD_COSTS.lecture_transform;
  return {
    recordingCost,
    transformCost,
    totalCost: recordingCost + transformCost,
  };
}
