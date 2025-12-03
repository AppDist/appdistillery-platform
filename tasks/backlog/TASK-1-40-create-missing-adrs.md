---
id: TASK-1-40
title: Create missing ADRs for Phase 0/1
priority: P2-Medium
complexity: 3
module: docs
status: BACKLOG
created: 2025-12-02
review-id: M6
fix-phase: 5
---

# TASK-1-40: Create Missing ADRs for Phase 0/1

## Description

Only 1 ADR exists (`0001-modular-monolith.md`). Create ADRs for the key architecture decisions made during Phase 0 and Phase 1 implementation.

## Acceptance Criteria

- [ ] Each ADR follows the project template format
- [ ] Context, decision, and consequences documented
- [ ] Links to relevant code sections included
- [ ] All 4 ADRs created and reviewed

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
