/**
 * Supabase server client utilities
 *
 * RECOMMENDED: Use @appdistillery/core/auth for server-side Supabase access.
 * This file re-exports from core for backwards compatibility.
 *
 * @example
 * ```typescript
 * // Preferred - import from core
 * import { createServerSupabaseClient } from '@appdistillery/core/auth'
 *
 * // Legacy - still works via re-export
 * import { createClient } from '@/lib/supabase/server'
 * ```
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@appdistillery/database/types';

// Re-export from core as the canonical server client
export { createServerSupabaseClient } from '@appdistillery/core/auth';

/**
 * Create a server-side Supabase client
 * @deprecated Use createServerSupabaseClient from @appdistillery/core/auth instead
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create an admin Supabase client with service role key
 *
 * Note: For admin operations, prefer using core services that handle
 * this internally (e.g., recordUsage in @appdistillery/core/ledger).
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
