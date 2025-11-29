---
name: debugging
description: Systematic debugging skill optimized for agentic coding. Use when encountering runtime errors, build failures, test failures, type errors, database issues, performance problems, or unexpected behavior. Provides structured workflows that maintain AI context focus while diagnosing issues efficiently. Essential for production debugging, RLS policy errors, hydration mismatches, or any code requiring systematic analysis.
---

# Debugging for AppDistillery Platform

Systematic debugging methodology optimized for agentic coding workflows.

## Quick Reference

**Stack:**
- Next.js 15 + React 19 + TypeScript 5.x
- Supabase (Postgres + Auth + RLS)
- Vitest + React Testing Library
- Turborepo + pnpm

**Commands:**
```bash
pnpm dev              # Start development server
pnpm build            # Build (find compile errors)
pnpm typecheck        # TypeScript errors only
pnpm test             # Run all tests
pnpm db:reset         # Reset local Supabase
```

## Core Philosophy: Context-Efficient Debugging

**FOCUS Method:**
- **F** - Frame the problem precisely (single sentence)
- **O** - Observe the actual vs expected behavior
- **C** - Constrain the scope (narrow before widening)
- **U** - Uncover root cause (not just symptoms)
- **S** - Solve and verify with minimal changes

### Golden Rules

1. **State the problem in one sentence** - Forces clarity
2. **Reproduce before investigating** - No reproduction = wasted context
3. **Read errors completely** - Full message before hypotheses
4. **Change one thing at a time** - Multiple changes obscure causality
5. **Verify fixes work** - Don't assume, confirm

## Issue Categories

| Issue Type | First Check | Reference |
|------------|-------------|-----------|
| Runtime error | Full stack trace, recent changes | `references/runtime-debugging.md` |
| Build failure | Cache clear, dependency check | `references/build-debugging.md` |
| Type error | TSC output, type definitions | `references/typescript-debugging.md` |
| Test failure | Isolation test, mock setup | `references/test-debugging.md` |
| Database/RLS | Auth context, policy check | `references/database-debugging.md` |
| Performance | Profile first, optimize second | `references/performance-debugging.md` |
| Hydration | Server vs client diff | `references/hydration-debugging.md` |

## AppDistillery-Specific Debugging

### brainHandle Errors

```typescript
// Debug brainHandle calls
async function debugBrainHandle(task: string, input: unknown) {
  console.log(`[brainHandle:${task}] Input:`, JSON.stringify(input, null, 2));

  const start = Date.now();
  try {
    const result = await brainHandle({ task, input, outputSchema });
    console.log(`[brainHandle:${task}] Success (${Date.now() - start}ms)`, {
      outputKeys: Object.keys(result.output),
      tokens: result.usage.totalTokens,
    });
    return result;
  } catch (error) {
    console.error(`[brainHandle:${task}] Failed (${Date.now() - start}ms)`, {
      error: error instanceof Error ? error.message : 'Unknown',
      input,
    });
    throw error;
  }
}
```

**Common brainHandle issues:**
| Error | Cause | Fix |
|-------|-------|-----|
| Invalid output | Schema mismatch | Check Zod schema, add `.describe()` |
| Rate limit | Too many requests | Add retry with backoff |
| Timeout | Complex generation | Simplify prompt, reduce output |

### recordUsage Errors

```typescript
// Debug usage recording
try {
  await recordUsage({
    orgId: session.orgId,
    action: 'agency:scope:generate',
    tokens: result.usage.totalTokens,
    cost: 50,
  });
} catch (error) {
  console.error('[recordUsage] Failed:', {
    orgId: session.orgId,
    action: 'agency:scope:generate',
    error: error instanceof Error ? error.message : 'Unknown',
  });
  // Don't throw - usage recording shouldn't break the operation
}
```

### Tenant Isolation Issues

**Symptom:** User sees data from wrong organization

```typescript
// Debug org_id filtering
const { data, error } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('org_id', session.orgId);

console.log('[TenantDebug]', {
  expectedOrgId: session.orgId,
  queryResults: data?.length,
  firstRecordOrgId: data?.[0]?.org_id,
  matches: data?.[0]?.org_id === session.orgId,
});
```

**Common causes:**
- Missing `.eq('org_id', session.orgId)` in query
- Server Action not checking session
- RLS policy not enabled
- Wrong session context passed

### Server Action Debugging

```typescript
'use server';

export async function debuggedAction(input: unknown) {
  console.log('[Action] Input:', JSON.stringify(input));

  // 1. Check auth
  const session = await getSessionContext();
  console.log('[Action] Session:', {
    hasSession: !!session,
    orgId: session?.orgId,
    userId: session?.userId,
  });
  if (!session) throw new Error('Unauthorized');

  // 2. Validate input
  const validated = Schema.safeParse(input);
  console.log('[Action] Validation:', {
    success: validated.success,
    errors: validated.error?.errors,
  });
  if (!validated.success) throw new Error('Invalid input');

  // 3. Execute operation
  const result = await operation(validated.data);
  console.log('[Action] Result:', {
    success: !!result,
    data: result,
  });

  return result;
}
```

## The Systematic Workflow

### Phase 1: Frame (30 seconds)

Write a single sentence:
```
"[Component/Function] produces [actual behavior] when [condition], expected [expected behavior]"
```

**Example:** "generateScope returns empty deliverables when requirements are long, expected parsed deliverables"

### Phase 2: Reproduce (1-2 minutes)

```bash
# Minimum viable reproduction
1. Start from known state (clean build)
2. Execute exact steps to trigger issue
3. Confirm issue appears consistently
4. Document: "Issue triggers when X, not when Y"
```

**Cannot reproduce?** Check:
- Environment variables (`.env.local`)
- Authentication state
- Database state (seeded data?)

### Phase 3: Constrain (2-5 minutes)

```
Broad → Narrow approach:
1. Which layer? (UI / Server Action / brainHandle / Database)
2. Which module? (agency / core / web)
3. Which function? (entry point to bug)
4. Which line? (exact location)
```

### Phase 4: Uncover Root Cause

```markdown
## Hypothesis Log
1. [Hypothesis]: [Test] → [Result: ✓/✗]
2. ...

## Root Cause
[One sentence describing actual cause]
```

### Phase 5: Solve

```bash
# Before fixing
git stash

# After fixing
git diff
# Run reproduction steps
# Verify fix works
```

## Debugging Commands

### Quick Diagnostics

```bash
# Clear all caches
rm -rf .next .turbo node_modules/.cache

# Reinstall dependencies
pnpm install --frozen-lockfile

# TypeScript check only
pnpm typecheck

# Run specific test
pnpm vitest run path/to/test.test.ts -t "test name"

# Check Supabase connection
supabase status
```

### Database Debugging

```bash
# Reset local database
pnpm db:reset

# Generate types from schema
pnpm db:generate

# View Supabase logs
supabase functions logs

# SQL console
supabase db inspect
```

### Next.js Debugging

```bash
# Verbose build output
DEBUG=* pnpm build

# Analyze bundle
ANALYZE=true pnpm build
```

## Context-Efficient Logging

```typescript
// Structured, filterable logging
const debug = {
  action: (name: string, data: unknown) =>
    console.log(`[Action:${name}]`, JSON.stringify(data)),

  db: (operation: string, data: unknown) =>
    console.log(`[DB:${operation}]`, data),

  brain: (task: string, data: unknown) =>
    console.log(`[Brain:${task}]`, data),

  error: (context: string, error: unknown) =>
    console.error(`[Error:${context}]`, error),
};

// Usage
debug.action('generateScope', { leadId, requirements });
debug.brain('agency.scope', { tokens: result.usage.totalTokens });
debug.db('insert:agency_briefs', { orgId: session.orgId });
```

## Common Patterns

### RLS Policy Debugging

```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'agency_leads';

-- List policies
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'agency_leads';

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"user-id","role":"authenticated"}';
SELECT * FROM agency_leads WHERE org_id = 'org-id';
RESET ROLE;
```

### Hydration Error Debugging

```typescript
// Common hydration issues in AppDistillery
// ❌ Date formatting differs server/client
new Date().toLocaleString()

// ✅ Use consistent formatting
format(date, 'MMM d, yyyy')

// ❌ Window/browser API on server
if (window.localStorage)

// ✅ Check mounting state
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### Test Mock Issues

```typescript
// Mock Core services for testing
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn().mockResolvedValue({
    output: mockOutput,
    usage: { totalTokens: 1000 },
  }),
}));

vi.mock('@appdistillery/core/auth', () => ({
  getSessionContext: vi.fn(() => ({
    orgId: 'org-123',
    userId: 'user-456',
  })),
}));

// Debug mock not being called
beforeEach(() => {
  vi.clearAllMocks();
  console.log('[Test] Mocks cleared');
});

afterEach(() => {
  console.log('[Test] brainHandle calls:', vi.mocked(brainHandle).mock.calls);
});
```

## Emergency Production Debugging

### Immediate Actions (< 5 minutes)

1. **Check deployment** - Did a recent deploy cause this?
2. **Review error logs** - Vercel logs, Supabase logs
3. **Assess blast radius** - How many users affected?
4. **Decide: Fix forward or rollback?**

### Rollback Decision

| Situation | Action |
|-----------|--------|
| Clear cause, simple fix | Fix forward |
| Unknown cause, many affected | Rollback immediately |
| Known cause, complex fix | Rollback, then fix |

### Rollback Commands

```bash
# Vercel
vercel rollback

# Or git revert
git revert HEAD
git push origin main
```

## When to Escalate

Stop debugging alone if:
- **> 30 minutes** without progress on reproduction
- **> 1 hour** without identifying root cause
- **Production impact** affecting multiple users
- **Security concern** potential data exposure

**Escalation format:**
```markdown
## Issue Summary
[One sentence]

## What I've Tried
1. [Action] → [Result]
2. [Action] → [Result]

## Current Hypothesis
[Best guess at root cause]

## What I Need
[Specific help required]
```

## References

Detailed guides for specific scenarios:
- `references/runtime-debugging.md` - Runtime errors and exceptions
- `references/build-debugging.md` - Build and compilation failures
- `references/typescript-debugging.md` - Type errors and TS debugging
- `references/test-debugging.md` - Test failures and flaky tests
- `references/database-debugging.md` - Database queries, RLS, auth
- `references/performance-debugging.md` - Performance profiling
- `references/hydration-debugging.md` - SSR/hydration mismatches

## Cross-Skill Integration

When debugging, also consult:
- **code-quality** - Correct patterns for Server Actions, brainHandle
- **testing** - Test structure, mocking patterns
- **project-context** - Architecture, module boundaries
