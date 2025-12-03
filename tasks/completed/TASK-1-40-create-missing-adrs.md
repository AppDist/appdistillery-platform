---
id: TASK-1-40
title: Create missing ADRs for Phase 0/1
priority: P2-Medium
complexity: 3
module: docs
status: DONE
created: 2025-12-02
review-id: M6
fix-phase: 5
---

# TASK-1-40: Create Missing ADRs for Phase 0/1

## Description

Only 1 ADR exists (`0001-modular-monolith.md`). Create ADRs for the key architecture decisions made during Phase 0 and Phase 1 implementation.

## Acceptance Criteria

- [x] Each ADR follows the project template format
- [x] Context, decision, and consequences documented
- [x] Links to relevant code sections included
- [x] All 4 ADRs created and reviewed

## Technical Notes

### ADRs to Create

1. **0002-ai-adapter-pattern.md**
   - Why Vercel AI SDK + provider adapters
   - Alternative approaches considered
   - Trade-offs and benefits

2. **0003-rls-helper-functions.md**
   - SECURITY DEFINER pattern for RLS
   - Why helper functions prevent recursion
   - Security implications

3. **0004-usage-tracking-design.md**
   - Ledger architecture decisions
   - Brain Units pricing model
   - Why per-request vs. subscription

4. **0005-tenant-context-via-cookies.md**
   - Cookie vs. URL-based tenant switching
   - Why cookies for multi-tenant context
   - Security considerations

### Files to Create

- `docs/decisions/0002-ai-adapter-pattern.md`
- `docs/decisions/0003-rls-helper-functions.md`
- `docs/decisions/0004-usage-tracking-design.md`
- `docs/decisions/0005-tenant-context-via-cookies.md`

### Patterns to Follow

- Follow ADR template in docs/decisions/
- Include Status: Accepted
- Reference code files where relevant
- Keep concise but complete

## Implementation Agent

- **Implement**: `documentation-writer`
- **Review**: `architecture-advisor`

## Execution

- **Mode**: Parallel with H6
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M6 |
| 2025-12-03 | All 4 ADRs created and completed |

## Completion Summary

### ADRs Created

All four Architecture Decision Records have been successfully created:

1. **ADR 0002: AI Adapter Pattern with Vercel AI SDK** (`docs/decisions/0002-ai-adapter-pattern.md`)
   - Documents the decision to use Vercel AI SDK as abstraction layer
   - Explains provider adapter pattern (Anthropic, OpenAI, Google)
   - Covers alternatives considered (direct API calls, LangChain)
   - Details the unified `GenerateResult<T>` interface
   - References: `packages/core/src/brain/adapters/`

2. **ADR 0003: SECURITY DEFINER Pattern for RLS** (`docs/decisions/0003-rls-helper-functions.md`)
   - Documents the solution to RLS infinite recursion problem
   - Explains the `is_member_of_org()` helper function pattern
   - Covers security implications of elevated privileges
   - Details alternative approaches and why they were rejected
   - References: `supabase/migrations/*_rls_recursion.sql`

3. **ADR 0004: Usage Tracking and Ledger Architecture** (`docs/decisions/0004-usage-tracking-design.md`)
   - Documents Brain Units as normalized pricing model
   - Explains event sourcing pattern for usage_events
   - Covers per-request vs. subscription billing decision
   - Details aggregation strategy and service role access
   - References: `packages/core/src/ledger/`

4. **ADR 0005: Cookie-Based Tenant Context** (`docs/decisions/0005-tenant-context-via-cookies.md`)
   - Documents the `active_tenant_id` cookie approach
   - Explains why cookies over URL-based tenant routing
   - Covers security considerations (httpOnly, SameSite, secure)
   - Details middleware integration for tenant resolution
   - References: `packages/core/src/auth/`, `apps/web/src/middleware.ts`

### Quality Checklist

- ✅ All ADRs follow the established template from ADR 0001
- ✅ Status: Accepted for all ADRs (dated 2025-12-01 or 2025-12-02)
- ✅ Context section explains the problem and alternatives considered
- ✅ Decision section provides clear, actionable decisions
- ✅ Consequences section lists both positive and negative outcomes
- ✅ References section links to relevant code files
- ✅ Security considerations documented where applicable
- ✅ Code examples included for clarity

### Files Created

```
docs/decisions/
├── 0001-modular-monolith.md        (existing)
├── 0002-ai-adapter-pattern.md      ✅ NEW
├── 0003-rls-helper-functions.md    ✅ NEW
├── 0004-usage-tracking-design.md   ✅ NEW
└── 0005-tenant-context-via-cookies.md ✅ NEW
```
