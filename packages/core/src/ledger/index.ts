// Stub - implement in Phase 1
export interface RecordUsageInput {
  orgId: string;
  userId?: string;
  moduleId: string;
  action: string;
  units?: number;
  tokens?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

export interface UsageEvent {
  id: string;
  orgId: string;
  userId?: string;
  moduleId: string;
  action: string;
  units: number;
  tokens?: number;
  durationMs?: number;
  createdAt: Date;
}

export async function recordUsage(input: RecordUsageInput): Promise<void> {
  throw new Error('Not implemented - Phase 1');
}

export async function getUsageHistory(
  orgId: string,
  limit?: number
): Promise<UsageEvent[]> {
  throw new Error('Not implemented - Phase 1');
}
