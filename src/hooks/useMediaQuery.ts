'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect screen size changes via CSS media queries.
 * Returns `true` when the media query matches.
 *
 * Usage:
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const isMobile = !isDesktop;
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
