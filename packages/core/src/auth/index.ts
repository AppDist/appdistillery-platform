import { createServerSupabaseClient } from './supabase-server'

export interface SessionContext {
  user: { id: string; displayName: string | null };
  org: { id: string; name: string; slug: string };
  membership: { role: 'owner' | 'admin' | 'member' };
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabaseClient()

  // Validate JWT with auth server (getUser() not getSession())
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // TODO: Phase 1 - Fetch organization and membership from database
  // For now, return minimal context to unblock development
  return {
    user: {
      id: user.id,
      displayName: user.user_metadata?.display_name || user.email || null,
    },
    org: {
      id: 'org-placeholder',
      name: 'Placeholder Org',
      slug: 'placeholder',
    },
    membership: {
      role: 'owner',
    },
  }
}

// Export Supabase client utilities
export { createBrowserSupabaseClient } from './supabase-browser'
export { createServerSupabaseClient } from './supabase-server'
export { updateSession } from './middleware'

// Export auth error handling
export { getAuthErrorMessage } from './errors'
