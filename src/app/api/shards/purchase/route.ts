import { NextRequest, NextResponse } from 'next/server';
import { addShards } from '@/lib/shards';
import { createClient } from '@/lib/supabase/server';
import { SHARD_PACKS } from '@/constants/shards';

/**
 * POST /api/shards/purchase
 * 
 * Placeholder endpoint for crediting shards after purchase.
 * In production, this should be called by a Stripe webhook 
 * after payment confirmation — NOT directly by the frontend.
 * 
 * Body: { packId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { packId } = await req.json();

    const pack = SHARD_PACKS.find(p => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    }

    // TODO: Verify payment with Stripe before crediting
    // For now, this is a placeholder that directly credits shards.
    // In production, this logic moves to a Stripe webhook handler.

    const result = await addShards(
      user.id, 
      pack.shards, 
      'purchase', 
      `Purchased ${pack.name} pack`,
      { packId: pack.id, price: pack.price }
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to credit shards' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      balance: result.balance,
      credited: pack.shards 
    });
  } catch (error) {
    console.error('Shard purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
