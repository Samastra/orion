'use client';

/**
 * SHARD BALANCE PROVIDER
 * 
 * React context that provides the user's shard balance to the entire app.
 * Fetches on mount, and exposes a `refreshBalance()` for components to 
 * trigger a re-fetch after deductions or purchases.
 * 
 * Usage:
 *   const { balance, refreshBalance, isLoading } = useShards();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ShardContextValue {
  /** Current shard balance */
  balance: number;
  /** Whether the balance is currently being fetched */
  isLoading: boolean;
  /** Force a re-fetch of the balance (call after purchase or generation) */
  refreshBalance: () => Promise<void>;
}

const ShardContext = createContext<ShardContextValue>({
  balance: 0,
  isLoading: true,
  refreshBalance: async () => {},
});

export function ShardBalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/shards/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
      }
    } catch (err) {
      console.warn('[ShardProvider] Failed to fetch balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return (
    <ShardContext.Provider value={{ balance, isLoading, refreshBalance }}>
      {children}
    </ShardContext.Provider>
  );
}

/**
 * Hook to access shard balance from any component.
 */
export function useShards() {
  return useContext(ShardContext);
}
