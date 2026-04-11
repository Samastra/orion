import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components.
 * This client handles cookie-based auth sessions automatically.
 *
 * Usage:
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: async (url, options) => {
          // If we are explicitly offline, don't even try the fetch.
          // This prevents the infinite 'NetworkError' loop in the console.
          if (typeof window !== 'undefined' && !window.navigator.onLine) {
            return new Promise((_, reject) => 
              reject(new TypeError('NetworkError when attempting to fetch resource.'))
            );
          }
          return fetch(url, options);
        }
      }
    }
  );
}
