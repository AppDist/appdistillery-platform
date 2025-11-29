# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start all packages (Turbopack)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm typecheck        # TypeScript checking
pnpm lint             # Lint all packages

# Database
pnpm db:reset         # Reset local Supabase
pnpm db:generate      # Generate TypeScript types from schema

# Single package commands
pnpm --filter @appdistillery/web dev
pnpm --filter @appdistillery/core test
```

## Architecture

**Modular Monolith** with Turborepo:

```
apps/web/           → Next.js 15 application
packages/core/      → Kernel: auth, brain (AI router), ledger, modules
packages/database/  → Migrations + generated Supabase types
packages/ui/        → Shared components
modules/agency/     → First module (consultancy tool)
```

**Data Flow:** UI → Server Action → Core Service (brainHandle/recordUsage) → Supabase

**Tenant Isolation:** All queries must include `org_id` filter. RLS policies enforce this at database level.

## Critical Rules

| Never | Always |
|-------|--------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` from `@appdistillery/core/brain` |
| Write to `usage_events` directly | Use `recordUsage()` from `@appdistillery/core/ledger` |
| Edit schema in Supabase Dashboard | Create migrations via `supabase migration new` |
| Return raw JSON from AI prompts | Use `generateObject` with Zod schema |
| Duplicate Zod schemas | Import from `modules/*/schemas/` |
| Import across modules | Use Core services or events |

## Naming Conventions

- **Core tables:** `public.<entity>` (e.g., `organizations`, `usage_events`)
- **Module tables:** `public.<module>_<entity>` (e.g., `agency_leads`)
- **Usage actions:** `<module>:<domain>:<verb>` (e.g., `agency:scope:generate`)
- **Brain tasks:** `<module>.<task>` (e.g., `agency.scope`)

## Key Files

- `.claude/CONTEXT.md` — Detailed session context (paste at session start)
- `docs/PROJECT_PLAN.md` — Full specifications and roadmap
- `.claude/commands/` — Custom slash commands (/debug, /review, /migration-new, etc.)
- `.claude/skills/` — Specialized skills (nextjs, supabase, testing, etc.)

## Commits

Format: `type(scope): subject` (max 100 chars)
- Types: feat, fix, docs, style, refactor, test, chore
- Scopes: core, database, ui, agency, web
