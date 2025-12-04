# Roadmap to 100/100

**Current Score:** ~93/100 (as of 2025-12-04)

Based on the 3-model comprehensive review and subsequent improvements, this document outlines the remaining work to reach a perfect 100/100 score.

---

## Score Breakdown

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Type Safety | 92 | 100 | 8 |
| Test Coverage | 92 | 100 | 8 |
| Documentation | 90 | 100 | 10 |
| Performance | 95 | 100 | 5 |
| Error Handling | 95 | 100 | 5 |
| Simplicity/Standards | 95 | 100 | 5 |

---

## 1. Type Safety: 92 → 100

### Remaining Type Assertions (9 total)

| Location | Issue | Fix | Effort |
|----------|-------|-----|--------|
| `brain/cache.ts` | Schema description extraction | Type-safe schema introspection | 1h |
| `auth/index.ts` | Database row transformations | Generate fresh types | 30m |
| `ledger/get-usage-summary.ts` | RPC return types | Create explicit interfaces | 1h |
| AI SDK responses | Provider-specific types | Justified: SDK limitation | N/A |
| Supabase queries | Query builder types | Justified: Supabase limitation | N/A |

**Action Items:**
- [ ] Add `// Type-justified: SDK limitation` comments to justified assertions
- [ ] Run `pnpm db:generate` to refresh database types
- [ ] Create `UsageSummaryRPCResult` interface for RPC calls

**Effort:** ~2.5h

---

## 2. Test Coverage: 92 → 100

### Missing Test Categories

| Category | Current | Target | Tests Needed |
|----------|---------|--------|--------------|
| E2E Tests | 0 | 10+ | Critical user flows |
| Integration Tests (CI) | Skip | Run | Supabase in GitHub Actions |
| Component Tests | Partial | Complete | Key UI components |

### E2E Tests (Playwright)

Priority flows to test:
1. **Auth Flow:** Sign up → Verify → Create tenant → Dashboard
2. **Agency Flow:** Create lead → Generate scope → Save
3. **Module Flow:** Install module → Use feature → Uninstall
4. **Tenant Flow:** Create org → Invite member → Switch tenant

**Files to Create:**
```
apps/web/e2e/
├── auth.spec.ts           # Auth flows
├── agency.spec.ts         # Agency module flows
├── modules.spec.ts        # Module management
├── tenants.spec.ts        # Tenant operations
└── fixtures/
    └── test-data.ts       # Shared test data
```

**Effort:** 8-12h

### Integration Tests in CI

Setup Supabase in GitHub Actions:
```yaml
# .github/workflows/test.yml
services:
  supabase:
    image: supabase/postgres
    # ... configuration
```

**Effort:** 4h

### Component Tests

Key components needing tests:
- `TenantSwitcher` - Tenant selection UI
- `UsageDashboard` - Usage visualization
- `ModuleCard` - Module install/uninstall

**Effort:** 4h

---

## 3. Documentation: 90 → 100

### Missing Documentation

| Item | Type | Location | Effort |
|------|------|----------|--------|
| `getUserTenants()` | JSDoc | `packages/core/src/auth/get-user-tenants.ts` | 15m |
| `transforms.ts` | JSDoc | `packages/core/src/auth/transforms.ts` | 15m |
| Logging ADR | ADR | `docs/decisions/` | 30m |
| Error Codes ADR | ADR | `docs/decisions/` | 30m |
| Caching ADR | ADR | `docs/decisions/` | 30m |
| API Reference | Docs | `docs/api/` | 2h |

### ADRs to Create

1. **ADR-006: Structured Logging**
   - Decision: Use `logger.error(context, message, data)` format
   - Context: Replace scattered `console.error` calls
   - Consequences: Consistent log format, future Sentry integration

2. **ADR-007: Error Code Standardization**
   - Decision: Use `ErrorCodes` enum with user-friendly messages
   - Context: String error messages lack structure
   - Consequences: Consistent error handling, i18n-ready

3. **ADR-008: Response Caching Strategy**
   - Decision: Per-task TTL caching with tenant isolation
   - Context: Reduce AI costs for repeated queries
   - Consequences: Faster responses, cost reduction

**Effort:** ~5h

---

## 4. Performance: 95 → 100

### Optimization Opportunities

| Area | Current | Improvement | Effort |
|------|---------|-------------|--------|
| `getSessionContext()` | DB query each call | Cache tenant data | 2h |
| Dashboard queries | Multiple queries | Batch with joins | 2h |
| Bundle size | Unmonitored | Add bundle analysis | 1h |

### Session Context Caching

```typescript
// packages/core/src/auth/session-cache.ts
const sessionCache = new Map<string, { data: SessionContext; expires: number }>()
const CACHE_TTL = 30_000 // 30 seconds

export async function getCachedSessionContext(): Promise<SessionContext | null> {
  const userId = await getAuthenticatedUserId()
  const cached = sessionCache.get(userId)

  if (cached && Date.now() < cached.expires) {
    return cached.data
  }

  const session = await getSessionContext()
  if (session) {
    sessionCache.set(userId, { data: session, expires: Date.now() + CACHE_TTL })
  }
  return session
}
```

### Bundle Analysis

Add to `package.json`:
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

**Effort:** ~5h

---

## 5. Error Handling: 95 → 100

### Remaining Improvements

| Item | Current | Target | Effort |
|------|---------|--------|--------|
| React Error Boundaries | None | Dashboard, Module pages | 2h |
| Migrate to ErrorCodes | Partial | All Server Actions | 3h |
| Error recovery UI | Basic | User-friendly with retry | 2h |

### Error Boundary Implementation

```typescript
// apps/web/src/components/error-boundary.tsx
'use client'

export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ReactErrorBoundary
      fallback={fallback}
      onError={(error) => {
        logger.error('ErrorBoundary', 'Caught error', { error })
        Sentry.captureException(error)
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
```

**Effort:** ~7h

---

## 6. Simplicity/Standards: 95 → 100

### Polish Items

| Item | Current | Target | Effort |
|------|---------|--------|--------|
| Justified type assertions | Undocumented | Add comments | 30m |
| Stricter TypeScript | Standard | `strictPropertyInitialization` | 1h |
| Unused code | Some | Run `knip --fix` | 30m |

**Effort:** ~2h

---

## Priority Order

### Quick Wins (Do First) - ~5h
- [ ] Document justified type assertions (30m)
- [ ] Run `pnpm db:generate` for fresh types (30m)
- [ ] Add missing JSDoc to auth functions (30m)
- [ ] Create 3 ADRs for new patterns (1.5h)
- [ ] Run `pnpm knip --fix` (30m)
- [ ] Stricter TypeScript options (1h)

### Medium Effort - ~16h
- [ ] E2E tests with Playwright (8-12h)
- [ ] Supabase CI integration (4h)

### Polish - ~12h
- [ ] Session context caching (2h)
- [ ] Dashboard query optimization (2h)
- [ ] Error boundaries (2h)
- [ ] Migrate all errors to ErrorCodes (3h)
- [ ] Component tests (4h)

---

## Effort Summary

| Priority | Tasks | Hours |
|----------|-------|-------|
| Quick wins | Type docs, JSDoc, ADRs, knip | ~5h |
| Medium | E2E tests, CI integration | ~16h |
| Polish | Caching, errors, components | ~12h |
| **Total** | | **~33h** |

---

## Milestones

| Score | Milestone | Effort |
|-------|-----------|--------|
| 93 → 95 | Quick wins complete | 5h |
| 95 → 97 | E2E tests added | 12h |
| 97 → 99 | CI integration, caching | 8h |
| 99 → 100 | Polish, error boundaries | 8h |

---

## Success Criteria

- [ ] All type assertions documented or fixed
- [ ] 95%+ test coverage (unit + integration + E2E)
- [ ] All functions have JSDoc
- [ ] ADRs for all architectural decisions
- [ ] No `console.error` calls (use `logger`)
- [ ] All errors use `ErrorCodes`
- [ ] `pnpm check` passes (typecheck + lint + knip + test)
- [ ] Bundle size monitored
- [ ] Error boundaries in place

---

## Related Documents

- `docs/reviews/phase-0-1-comprehensive-review.md` - Original 3-model review
- `.claude/skills/simplicity/SKILL.md` - Simplicity guidelines
- `.claude/skills/project-context/` - Project context and patterns
