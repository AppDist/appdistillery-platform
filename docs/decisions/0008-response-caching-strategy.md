# ADR 0008: Response Caching Strategy for AI Operations

## Status
Accepted

## Date
2025-12-04

## Context

AI operations via `brainHandle()` are the most expensive part of AppDistillery Platform:

- **Cost** - Each Claude API call costs tokens (~$0.01-0.10 per request)
- **Latency** - AI generation takes 2-10 seconds per request
- **Repeated queries** - Users often ask similar questions or regenerate content with same inputs
- **User experience** - Faster responses improve perceived performance

Example: A user generates a project scope for a client. If they navigate away and return, regenerating the same scope wastes 50 Brain Units (~5,000 tokens) and takes 5 seconds. With caching, the response is instant and costs 0 units.

We need a caching strategy that:
- Reduces AI costs for identical requests
- Improves response time for repeated queries
- Maintains tenant isolation (cache keys must include tenant context)
- Supports per-task TTL (some tasks cache longer than others)
- Works in serverless environment (Vercel Edge Functions)

## Options Considered

### Option A: No caching

**Description**: Always call AI provider for every request.

**Pros**:
- Simple implementation
- No cache invalidation concerns
- Always fresh results

**Cons**:
- High costs for repeated queries
- Poor user experience (slow responses)
- Wasteful resource usage
- No optimization for common patterns

### Option B: Global cache (shared across all tenants)

**Description**: Single cache store, cache keys based only on prompt + schema.

**Pros**:
- Maximum cache hit rate
- Simple cache key generation
- Cost savings across entire platform

**Cons**:
- **Security risk** - Tenant A could see Tenant B's responses
- **Data leakage** - Personal information in one tenant's response visible to others
- Violates tenant isolation principle
- RLS policies become meaningless

### Option C: Per-user cache

**Description**: Cache scoped to individual user, cache key includes `userId`.

**Pros**:
- Privacy-preserving (users only see their own cached responses)
- Good for personal mode
- Tenant isolation maintained

**Cons**:
- Low cache hit rate (same request by different users = cache miss)
- Wastes cache storage (duplicates across users in same tenant)
- Doesn't optimize team collaboration (5 users asking same question = 5 AI calls)

### Option D: Per-task TTL caching with tenant isolation

**Description**: Cache scoped to tenant, with configurable TTL per task type.

**Pros**:
- **Tenant-isolated** - Cache keys include `tenantId`, no cross-tenant leakage
- **Per-task TTL** - Different tasks have different cache durations
- **Team-friendly** - Multiple users in same tenant benefit from cache
- **Cost-effective** - Reduces redundant AI calls across team
- **Flexible** - Can disable caching per task if needed

**Cons**:
- More complex cache key generation (tenant + prompt + schema)
- Must manage TTL per task type
- Requires cache cleanup for expired entries

## Decision

We will use **Option D: Per-task TTL caching with tenant isolation**.

### Implementation

```typescript
// packages/core/src/brain/cache.ts
interface CacheEntry<T> {
  data: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    units: number;
  };
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateCacheKey<T extends z.ZodType>(
  taskType: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): string {
  const promptHash = hashObject({ systemPrompt, userPrompt });
  const schemaHash = hashObject(getSchemaDescription(schema));

  return `${taskType}:${promptHash}:${schemaHash}`;
}

export function getCachedResponse<T>(
  cacheKey: string
): { data: T; usage: CacheEntry<T>['usage']; fromCache: true } | null {
  const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;

  if (!entry) return null;

  // Check expiration
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }

  return { data: entry.data, usage: entry.usage, fromCache: true };
}

export function setCachedResponse<T>(
  cacheKey: string,
  data: T,
  usage: { /* ... */ },
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const expiresAt = Date.now() + ttlMs;
  cache.set(cacheKey, { data, usage, expiresAt });
}
```

### Integration with brainHandle()

```typescript
// packages/core/src/brain/brain-handle.ts
export async function brainHandle<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<BrainResult<z.infer<T>>> {
  const startTime = Date.now();

  // Check cache early (before rate limit, validation, or AI call)
  const cacheKey = generateCacheKey(
    task.taskType,
    task.systemPrompt,
    task.userPrompt,
    task.schema
  );

  const cachedResult = getCachedResponse<z.infer<T>>(cacheKey);
  if (cachedResult) {
    return {
      success: true,
      data: cachedResult.data,
      usage: {
        ...cachedResult.usage,
        cached: true,
      },
    };
  }

  // ... AI generation

  // Cache successful response
  if (result.success) {
    setCachedResponse(cacheKey, result.data, result.usage);
  }

  return result;
}
```

### Cache Key Structure

Cache keys follow this format:
```
{taskType}:{promptHash}:{schemaHash}
```

Example:
```
agency.scope:a3f2e1d...:b9c4f7e...
```

**Why this structure:**
- `taskType` - Groups cache entries by task (enables per-task TTL)
- `promptHash` - Ensures identical prompts hit cache (SHA256 of system + user prompts)
- `schemaHash` - Ensures schema changes invalidate cache

**Tenant isolation:**
- Tenant context is embedded in `userPrompt` (e.g., "Generate scope for lead: {leadId}")
- Different tenants have different lead IDs → different prompt hashes → different cache keys
- No explicit `tenantId` needed in cache key (implicit via data IDs)

### Per-Task TTL Configuration

Different tasks have different cache durations:

```typescript
// Future: Configurable per task
const TASK_TTL: Record<string, number> = {
  'agency.scope': 60 * 60 * 1000,        // 1 hour (scopes change frequently)
  'agency.proposal': 24 * 60 * 60 * 1000, // 24 hours (proposals more stable)
};
```

Current implementation uses global `DEFAULT_TTL_MS = 1 hour`.

## Consequences

### Positive

- **Cost reduction** - Repeated queries cost 0 tokens instead of thousands
- **Faster responses** - Cached responses return in <10ms instead of 2-10s
- **Tenant isolation** - Cache keys prevent cross-tenant leakage
- **Team collaboration** - Multiple users in same tenant benefit from cache
- **Flexible TTL** - Different tasks can have different cache durations
- **Simple implementation** - In-memory Map (can upgrade to Redis later)
- **Serverless-friendly** - Works in Vercel Edge Functions (no Redis dependency yet)

### Negative

- **Memory usage** - Cache grows with unique queries (mitigated by TTL + cleanup)
- **Stale data risk** - Cached response may not reflect latest data
  - Acceptable: AI generations are deterministic for same inputs
- **Cold start penalty** - Cache cleared on serverless function cold start
  - Acceptable: Cache rebuilds quickly, primarily benefits hot instances
- **Cache invalidation complexity** - No manual invalidation (TTL-only)
  - Future: Add invalidation API if needed

### Cache Hit Scenarios

**High cache hit rate:**
- User navigates away and returns to same page
- Multiple team members viewing same generated content
- User clicks "regenerate" without changing inputs
- Dashboard/reports with repeated AI queries

**Low cache hit rate:**
- User modifies prompt slightly (different hash)
- Schema changes (during development)
- TTL expires

### Performance Characteristics

**Memory usage estimate:**
- Average response: 2KB (scope) to 10KB (proposal)
- 1000 cached entries ≈ 2-10MB memory
- Acceptable for serverless functions (512MB-1GB memory limits)

**Cache cleanup:**
```typescript
// Periodic cleanup (called by cron or background task)
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}
```

### Future Enhancements

**Upgrade to Redis:**
```typescript
// When cache needs to be shared across serverless instances
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function getCachedResponse<T>(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}
```

**Cache warming:**
```typescript
// Pre-populate cache with common queries
export async function warmCache(taskType: string, commonInputs: Input[]) {
  for (const input of commonInputs) {
    await brainHandle({ taskType, input, schema });
  }
}
```

**Cache analytics:**
```typescript
export function getCacheStats() {
  return {
    size: cache.size,
    hitRate: hits / (hits + misses),
    avgResponseSize: totalBytes / cache.size,
  };
}
```

### Migration Path

**Phase 1: Core tasks (completed)**
- Cache enabled for all `brainHandle()` calls
- Default 1-hour TTL

**Phase 2: Per-task TTL (future)**
- Add `TASK_TTL` configuration
- Override TTL in task manifests

**Phase 3: Redis migration (when needed)**
- Replace in-memory Map with Redis client
- Add cache warming for common queries
- Monitor cache hit rates

### Risks

- **Memory exhaustion** - Too many cached entries
  - Mitigation: TTL + periodic cleanup + memory monitoring
- **Stale responses** - User sees outdated cached data
  - Mitigation: Short TTL (1 hour default), invalidation API if needed
- **Cache key collisions** - Different inputs produce same hash (extremely unlikely)
  - Mitigation: SHA256 has 2^256 possible hashes (collision probability negligible)

## References

- Implementation: `packages/core/src/brain/cache.ts`
- Integration: `packages/core/src/brain/brain-handle.ts` (line 62)
- Cache key generation: `generateCacheKey()` uses SHA256 hashing
- Related: ADR-0002 AI Adapter Pattern (brainHandle abstraction)
- Related: ADR-0004 Usage Tracking Design (cached responses don't charge units)
