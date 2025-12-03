# Task Index

> Track all tasks for AppDistillery Platform development.

## Statistics

| Phase | Status | Count |
|-------|--------|-------|
| Phase 0 | Completed | 9 |
| Phase 0 | Backlog | 0 |
| Phase 1 | Completed | 40 |
| Phase 1 | Backlog | 1 |
| Phase 2 | Backlog | 4 |
| Phase 3 | Backlog | 1 |
| **Total** | | **55** |

---

## Phase 0: Infrastructure

> Setup and configuration - foundation for development.

### Completed

| ID | Title | Complexity |
|----|-------|------------|
| [TASK-0-01](completed/TASK-0-01-turborepo-setup.md) | Turborepo monorepo setup | 3 |
| [TASK-0-02](completed/TASK-0-02-nextjs-react-app.md) | Next.js 15 + React 19 app | 3 |
| [TASK-0-03](completed/TASK-0-03-tailwind-v4.md) | Tailwind CSS v4 integration | 2 |
| [TASK-0-04](completed/TASK-0-04-supabase-local.md) | Supabase local development | 2 |
| [TASK-0-05](completed/TASK-0-05-shadcn-config.md) | shadcn/ui configuration | 2 |
| [TASK-0-06](completed/TASK-0-06-vitest-setup.md) | Vitest testing setup | 2 |
| [TASK-0-08](completed/TASK-0-08-claude-context.md) | Claude Code context setup | 3 |
| [TASK-0-09](completed/TASK-0-09-adr-structure.md) | ADR documentation structure | 1 |
| [TASK-0-07](completed/TASK-0-07-sentry-monitoring.md) | Sentry error monitoring | 2 |

---

## Phase 1: Core Kernel

> Identity, module registry, usage ledger, and AI router.

### Identity & Tenancy

#### Completed

| ID | Title | Complexity |
|----|-------|------------|
| [TASK-1-01](completed/TASK-1-01-supabase-auth.md) | Supabase Auth integration | 3 |
| [TASK-1-02](completed/TASK-1-02-organizations-rls.md) | Tenants & account types + RLS | 3 |
| [TASK-1-03](completed/TASK-1-03-org-creation-flow.md) | Account creation flows | 2 |
| [TASK-1-04](completed/TASK-1-04-org-switcher.md) | Tenant switcher | 2 |
| [TASK-1-05](completed/TASK-1-05-module-registry-tables.md) | Module registry tables | 2 |
| [TASK-1-07](completed/TASK-1-07-usage-events-table.md) | Usage events table + RLS | 2 |
| [TASK-1-08](completed/TASK-1-08-record-usage-service.md) | recordUsage() service | 2 |
| [TASK-1-06](completed/TASK-1-06-module-registry-helpers.md) | Module registry helpers | 2 |
| [TASK-1-09](completed/TASK-1-09-usage-history-query.md) | Usage history query | 2 |

#### Backlog

**Account Types:**
- **Personal** - Individual user, email only, per-user usage
- **Household** - Shared family/friends group, shared usage pool
- **Organization** - Business with org numbers, shared usage pool

### Brain (AI Router)

#### Completed

| ID | Title | Complexity |
|----|-------|------------|
| [TASK-1-10](completed/TASK-1-10-anthropic-adapter.md) | Anthropic adapter | 3 |
| [TASK-1-10a](completed/TASK-1-10a-openai-adapter.md) | OpenAI adapter | 2 |
| [TASK-1-10b](completed/TASK-1-10b-google-adapter.md) | Google Gemini adapter | 2 |
| [TASK-1-11](completed/TASK-1-11-brain-handle-service.md) | brainHandle() service | 3 |
| [TASK-1-12](completed/TASK-1-12-brain-service-tests.md) | Brain service tests | 2 |

### Dashboard & Verification

#### Completed

| ID | Title | Complexity |
|----|-------|------------|
| [TASK-1-13](completed/TASK-1-13-usage-dashboard.md) | Usage dashboard component | 2 |
| [TASK-1-14](completed/TASK-1-14-rls-isolation-test.md) | RLS isolation test | 3 |
| [TASK-1-15](completed/TASK-1-15-core-integration-test.md) | Core kernel integration test | 3 |

### Phase 0/1 Review Fixes

> 25 improvement tasks from comprehensive review - targeting 100/100 all areas

#### Fix Phase 1: Security & RLS (5 tasks)

| ID | Title | Priority | Complexity | Agent |
|----|-------|----------|------------|-------|
| [TASK-1-16](backlog/TASK-1-16-fix-rls-tenant-modules.md) | Fix RLS recursion in tenant_modules | P0-Critical | 2 | database-architect |
| [TASK-1-17](backlog/TASK-1-17-fix-rls-usage-events.md) | Fix RLS recursion in usage_events | P0-Critical | 2 | database-architect |
| [TASK-1-18](backlog/TASK-1-18-add-security-headers.md) | Add security headers | P0-Critical | 1 | appdistillery-developer |
| [TASK-1-19](backlog/TASK-1-19-fix-ai-package-vulnerability.md) | Fix ai package vulnerability | P1-High | 1 | appdistillery-developer |
| [TASK-1-20](backlog/TASK-1-20-add-tenant-members-updated-at.md) | Add updated_at to tenant_members | P3-Low | 1 | database-architect |

#### Fix Phase 2: Performance & Architecture (5 tasks)

| ID | Title | Priority | Complexity | Agent |
|----|-------|----------|------------|-------|
| [TASK-1-21](backlog/TASK-1-21-server-side-aggregation.md) | Server-side aggregation for getUsageSummary | P0-Critical | 4 | appdistillery-developer |
| [TASK-1-22](backlog/TASK-1-22-fix-redundant-getuser-calls.md) | Fix redundant getUser() calls | P1-High | 2 | appdistillery-developer |
| [TASK-1-23](backlog/TASK-1-23-singleton-record-usage-client.md) | Singleton pattern for recordUsage | P2-Medium | 1 | appdistillery-developer |
| [TASK-1-24](backlog/TASK-1-24-fix-supabase-ssr-mismatch.md) | Fix @supabase/ssr version mismatch | P1-High | 1 | appdistillery-developer |
| [TASK-1-25](backlog/TASK-1-25-fix-turbo-pipeline-deps.md) | Fix Turbo pipeline dependencies | P3-Low | 1 | appdistillery-developer |

#### Fix Phase 3: Testing Coverage (3 tasks)

| ID | Title | Priority | Complexity | Agent |
|----|-------|----------|------------|-------|
| [TASK-1-26](backlog/TASK-1-26-google-adapter-tests.md) | Create Google adapter tests | P1-High | 3 | test-engineer |
| [TASK-1-27](backlog/TASK-1-27-module-registry-tests.md) | Create module registry tests | P1-High | 3 | test-engineer |
| [TASK-1-28](backlog/TASK-1-28-session-context-tests.md) | Create getSessionContext tests | P2-Medium | 2 | test-engineer |

#### Fix Phase 4: Code Quality & DRY (5 tasks)

| ID | Title | Priority | Complexity | Agent |
|----|-------|----------|------------|-------|
| [TASK-1-29](backlog/TASK-1-29-extract-adapter-utilities.md) | Extract shared adapter utilities | P1-High | 3 | appdistillery-developer |
| [TASK-1-30](backlog/TASK-1-30-standardize-form-patterns.md) | Standardize form patterns | P2-Medium | 2 | ux-ui |
| [TASK-1-31](backlog/TASK-1-31-remove-type-assertions.md) | Remove type assertions (as any) | P2-Medium | 2 | appdistillery-developer |
| [TASK-1-32](backlog/TASK-1-32-consolidate-cn-utility.md) | Consolidate cn() utility | P2-Medium | 1 | appdistillery-developer |
| [TASK-1-33](backlog/TASK-1-33-fix-tenant-switcher-links.md) | Fix tenant switcher links | P2-Medium | 1 | ux-ui |

#### Fix Phase 5: UX & Documentation (7 tasks)

| ID | Title | Priority | Complexity | Agent |
|----|-------|----------|------------|-------|
| [TASK-1-34](backlog/TASK-1-34-password-reset-flow.md) | Implement password reset flow | P1-High | 3 | ux-ui |
| [TASK-1-35](backlog/TASK-1-35-theme-provider-dark-mode.md) | Add theme provider (dark mode) | P1-High | 2 | ux-ui |
| [TASK-1-36](backlog/TASK-1-36-aria-live-error-messages.md) | Add aria-live to error messages | P3-Low | 1 | ux-ui |
| [TASK-1-37](backlog/TASK-1-37-skip-to-content-link.md) | Add skip-to-content link | P3-Low | 1 | ux-ui |
| [TASK-1-38](backlog/TASK-1-38-chart-accessibility.md) | Improve chart accessibility | P3-Low | 2 | ux-ui |
| [TASK-1-39](backlog/TASK-1-39-eslint-flat-config.md) | Add ESLint flat config | P2-Medium | 1 | appdistillery-developer |
| [TASK-1-40](completed/TASK-1-40-create-missing-adrs.md) | Create missing ADRs | 3 |

**Phase 1 Exit Criteria:**
- User signup → create tenant → see dashboard
- brainHandle() call → usage_event recorded
- RLS tenant isolation verified
- Personal/Household/Organization accounts all work

**Review Fix Exit Criteria (100/100 all areas):**
- All Critical/High issues resolved
- Security score: 100/100
- Architecture score: 100/100
- Code Quality score: 100/100
- Testing score: 100/100
- Performance score: 100/100
- Documentation score: 100/100
- UX/UI score: 100/100

---

## Phase 2: Agency Module (Epics)

> First module - consultancy tool for proposals.

| ID | Title | Priority | Sub-tasks |
|----|-------|----------|-----------|
| [TASK-2-01](backlog/TASK-2-01-agency-database-schema.md) | Agency database schema | P1-High | Tables, RLS, indexes |
| [TASK-2-02](backlog/TASK-2-02-agency-ai-capabilities.md) | Agency AI capabilities | P1-High | Zod schemas, prompts |
| [TASK-2-03](backlog/TASK-2-03-agency-ui-components.md) | Agency UI components | P1-High | Forms, views, editor |
| [TASK-2-04](backlog/TASK-2-04-agency-pipeline.md) | Agency pipeline & integration | P2-Medium | Pipeline, manifest |

**Exit Criteria:**
- Lead → AI scope → draft proposal works
- Usage recorded correctly
- Pipeline displays all leads

---

## Phase 3: Hardening (Planning)

> Polish, error handling, exports, and testing.

| ID | Title |
|----|-------|
| [TASK-3-01](backlog/TASK-3-01-phase3-planning.md) | Phase 3 planning epic |

---

## Task Workflow

```
backlog/ → active/ → completed/
```

1. **Backlog**: Tasks defined but not started
2. **Active**: Currently in progress (max 2-3 at a time)
3. **Completed**: Done and verified

## Naming Convention

```
TASK-{phase}-{number}-{slug}.md
```

Examples:
- `TASK-0-01-turborepo-setup.md` (Phase 0, task 1)
- `TASK-1-05-module-registry-tables.md` (Phase 1, task 5)
- `TASK-2-01-agency-database-schema.md` (Phase 2, epic 1)

## Priority Levels

| Priority | Description |
|----------|-------------|
| P1-High | Critical for current milestone |
| P2-Medium | Important but not blocking |
| P3-Low | Nice to have, future consideration |

## Complexity Points

| Points | Description |
|--------|-------------|
| 1 | Trivial (< 1 hour) |
| 2 | Simple (1-4 hours) |
| 3 | Medium (half day) |
| 4 | Complex (1 day) |
| 5 | Very Complex (multi-day) |
