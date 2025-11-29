// Stub - implement in Phase 1
export interface SessionContext {
  user: { id: string; displayName: string | null };
  org: { id: string; name: string; slug: string };
  membership: { role: 'owner' | 'admin' | 'member' };
}

export async function getSessionContext(): Promise<SessionContext> {
  throw new Error('Not implemented - Phase 1');
}
