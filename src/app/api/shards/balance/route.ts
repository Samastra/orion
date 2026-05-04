import { NextResponse } from 'next/server';
import { getShardBalance } from '@/lib/shards';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/shards/balance
 * Returns the authenticated user's current shard balance.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const balance = await getShardBalance(user.id);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Shard balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
