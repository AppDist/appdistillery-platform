# Task Index

> Track all tasks for AppDistillery Platform development.

## Statistics

| Phase | Status | Count |
|-------|--------|-------|
| Phase 0 | Completed | 9 |
| Phase 0 | Backlog | 0 |
| Phase 1 | Completed | 1 |
| Phase 1 | Backlog | 16 |
| Phase 2 | Backlog | 4 |
| Phase 3 | Backlog | 1 |
| **Total** | | **31** |

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

#### Backlog

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| [TASK-1-02](backlog/TASK-1-02-organizations-rls.md) | Tenants & account types + RLS | P1-High | 3 |
| [TASK-1-03](backlog/TASK-1-03-org-creation-flow.md) | Account creation flows | P1-High | 2 |
| [TASK-1-04](backlog/TASK-1-04-org-switcher.md) | Tenant switcher | P2-Medium | 2 |

**Account Types:**
- **Personal** - Individual user, email only, per-user usage
- **Household** - Shared family/friends group, shared usage pool
- **Organization** - Business with org numbers, shared usage pool

### Module Registry

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| [TASK-1-05](backlog/TASK-1-05-module-registry-tables.md) | Module registry tables | P1-High | 2 |
| [TASK-1-06](backlog/TASK-1-06-module-registry-helpers.md) | Module registry helpers | P2-Medium | 2 |

### Usage Ledger

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| [TASK-1-07](backlog/TASK-1-07-usage-events-table.md) | Usage events table + RLS | P1-High | 2 |
| [TASK-1-08](backlog/TASK-1-08-record-usage-service.md) | recordUsage() service | P1-High | 2 |
| [TASK-1-09](backlog/TASK-1-09-usage-history-query.md) | Usage history query | P2-Medium | 2 |

### Brain (AI Router)

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| [TASK-1-10](backlog/TASK-1-10-anthropic-adapter.md) | Anthropic adapter | P1-High | 3 |
| [TASK-1-10a](backlog/TASK-1-10a-openai-adapter.md) | OpenAI adapter | P1-High | 2 |
| [TASK-1-10b](backlog/TASK-1-10b-google-adapter.md) | Google Gemini adapter | P1-High | 2 |
| [TASK-1-11](backlog/TASK-1-11-brain-handle-service.md) | brainHandle() service | P1-High | 3 |
| [TASK-1-12](backlog/TASK-1-12-brain-service-tests.md) | Brain service tests | P1-High | 2 |

### Dashboard & Verification

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| [TASK-1-13](backlog/TASK-1-13-usage-dashboard.md) | Usage dashboard component | P2-Medium | 2 |
| [TASK-1-14](backlog/TASK-1-14-rls-isolation-test.md) | RLS isolation test | P1-High | 3 |
| [TASK-1-15](backlog/TASK-1-15-core-integration-test.md) | Core kernel integration test | P1-High | 3 |

**Exit Criteria:**
- User signup → create tenant → see dashboard
- brainHandle() call → usage_event recorded
- RLS tenant isolation verified
- Personal/Household/Organization accounts all work

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
