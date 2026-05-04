-- ═══════════════════════════════════════════════════════════════
-- SHARD SYSTEM MIGRATION
-- Adds shard balance tracking, transaction logging, and atomic
-- deduction/credit functions to the existing database.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add shard_balance column to profiles
-- New users get 200 free shards (signup bonus)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS shard_balance integer DEFAULT 200 NOT NULL;

-- Also track chat messages for the "1 shard per 5 messages" system
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS chat_messages_since_deduction integer DEFAULT 0 NOT NULL;


-- 2. Create shard_transactions audit table
CREATE TABLE IF NOT EXISTS public.shard_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,                          -- positive = credit, negative = debit
  type text NOT NULL,                               -- 'purchase', 'deduction', 'signup_bonus'
  reason text,                                      -- 'practice_mcq', 'practice_flashcard', 'chat_messages'
  metadata jsonb DEFAULT '{}',                      -- { count: 20, sessionId: '...' }
  balance_after integer NOT NULL,                   -- snapshot of balance after this transaction
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_shard_transactions_user 
  ON public.shard_transactions(user_id, created_at DESC);


-- 3. Row Level Security for shard_transactions
ALTER TABLE public.shard_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shard transactions" ON public.shard_transactions;
CREATE POLICY "Users can view own shard transactions" ON public.shard_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role inserts via RPC (SECURITY DEFINER functions bypass RLS)


-- 4. Atomic shard deduction function (prevents race conditions)
CREATE OR REPLACE FUNCTION public.deduct_shards(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  -- Lock the row to prevent concurrent deductions from causing negative balance
  SELECT shard_balance INTO current_balance
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND', 'balance', 0);
  END IF;

  IF current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_SHARDS', 'balance', current_balance);
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE public.profiles SET shard_balance = new_balance WHERE id = p_user_id;

  INSERT INTO public.shard_transactions (user_id, amount, type, reason, metadata, balance_after)
  VALUES (p_user_id, -p_amount, p_type, p_reason, p_metadata, new_balance);

  RETURN jsonb_build_object('success', true, 'balance', new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Atomic shard credit function (for purchases, bonuses)
CREATE OR REPLACE FUNCTION public.add_shards(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  SELECT shard_balance INTO current_balance
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND', 'balance', 0);
  END IF;

  new_balance := current_balance + p_amount;

  UPDATE public.profiles SET shard_balance = new_balance WHERE id = p_user_id;

  INSERT INTO public.shard_transactions (user_id, amount, type, reason, metadata, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_reason, p_metadata, new_balance);

  RETURN jsonb_build_object('success', true, 'balance', new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Atomic chat message counter + deduction function
-- Increments the message counter; when it hits the threshold, deducts 1 shard and resets
CREATE OR REPLACE FUNCTION public.increment_chat_and_maybe_deduct(
  p_user_id uuid,
  p_messages_per_shard integer DEFAULT 5
) RETURNS jsonb AS $$
DECLARE
  current_balance integer;
  current_count integer;
  new_count integer;
  new_balance integer;
  did_deduct boolean := false;
BEGIN
  SELECT shard_balance, chat_messages_since_deduction INTO current_balance, current_count
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND', 'balance', 0);
  END IF;

  new_count := current_count + 1;

  IF new_count >= p_messages_per_shard THEN
    -- Time to deduct
    IF current_balance < 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_SHARDS', 'balance', current_balance);
    END IF;

    new_balance := current_balance - 1;
    new_count := 0;
    did_deduct := true;

    UPDATE public.profiles 
    SET shard_balance = new_balance, chat_messages_since_deduction = new_count 
    WHERE id = p_user_id;

    INSERT INTO public.shard_transactions (user_id, amount, type, reason, metadata, balance_after)
    VALUES (p_user_id, -1, 'deduction', 'chat_messages', 
            jsonb_build_object('message_bundle', p_messages_per_shard), new_balance);
  ELSE
    new_balance := current_balance;
    UPDATE public.profiles 
    SET chat_messages_since_deduction = new_count 
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'balance', new_balance, 
    'chat_count', new_count,
    'did_deduct', did_deduct
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
