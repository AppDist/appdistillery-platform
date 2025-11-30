---
name: project-context
description: Authoritative context for AppDistillery Platform - a modular monolith SaaS with AI-powered consultancy tools. Use when installing packages, creating modules, adding integrations, or making architecture decisions to prevent duplicates and ensure consistency.
---

# AppDistillery Platform Context

## Project Overview

AppDistillery is a **modular monolith SaaS** built with:
- **Frontend:** Next.js 15 + React 19 + TailwindCSS 4
- **Backend:** Supabase (Postgres + Auth) + Vercel AI SDK
- **Monorepo:** Turborepo with pnpm workspaces
- **AI:** Anthropic Claude via `brainHandle()` abstraction

## Quick Architecture Reference

```
apps/web/           → Next.js 15 application
packages/core/      → Kernel: auth, brain, ledger, modules
packages/database/  → Migrations + generated Supabase types
packages/ui/        → Shared components (shadcn/ui)
modules/agency/     → First module (consultancy tool)
```

**Data Flow:** UI → Server Action → `brainHandle()` → `recordUsage()` → Supabase

## Critical Rules

| Never | Always |
|-------|--------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` from `@appdistillery/core/brain` |
| Write to `usage_events` directly | Use `recordUsage()` from `@appdistillery/core/ledger` |
| Edit schema in Supabase Dashboard | Create migrations via `supabase migration new` |
| Return raw JSON from AI prompts | Use `generateObject` with Zod schema |
| Duplicate Zod schemas | Import from `modules/*/schemas/` |
| Import across modules | Use Core services or events |
| Query without org_id | Always filter by `org_id` for tenant isolation |

## When to Use This Skill

This skill should be consulted when:

1. **Installing packages** - Check [dependencies.md](references/dependencies.md) first to prevent duplicates
2. **Creating new modules** - Follow patterns in [architecture-map.md](references/architecture-map.md)
3. **Adding integrations** - Check [integration-registry.md](references/integration-registry.md)
4. **Writing Server Actions** - Follow patterns in [module-patterns.md](references/module-patterns.md)
5. **Setting up environment** - Reference [environment-vars.md](references/environment-vars.md)
6. **Making architecture decisions** - Consult architecture-map.md and module-patterns.md

## Key Commands

```bash
pnpm dev              # Start all packages (Turbopack)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm typecheck        # TypeScript checking
pnpm db:reset         # Reset local Supabase
pnpm db:generate      # Generate types from schema
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Core tables | `public.<entity>` | `organizations`, `usage_events` |
| Module tables | `public.<module>_<entity>` | `agency_leads`, `agency_briefs` |
| Usage actions | `<module>:<domain>:<verb>` | `agency:scope:generate` |
| Brain tasks | `<module>.<task>` | `agency.scope` |

## Reference Files

For detailed information, consult:

- **[architecture-map.md](references/architecture-map.md)** - Project structure, Core kernel, module system
- **[dependencies.md](references/dependencies.md)** - All workspace packages with versions
- **[environment-vars.md](references/environment-vars.md)** - Required environment variables
- **[integration-registry.md](references/integration-registry.md)** - Supabase, Anthropic integration details
- **[module-patterns.md](references/module-patterns.md)** - Coding patterns, Server Actions, Zod schemas

## Available Agents

For complex multi-step tasks, delegate to specialized agents in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| strategic-advisor | Planning, task decomposition, architecture decisions |
| appdistillery-developer | Backend implementation, Server Actions, Core kernel |
| ux-ui | Frontend components, styling, accessibility |
| database-architect | Schema design, migrations, RLS policies |
| test-engineer | TDD workflow, test writing, coverage |
| code-reviewer | Iterative review, pattern guidance |
| security-auditor | Threat modeling, RLS verification |
| performance-analyst | N+1 detection, optimization |
| architecture-advisor | Module boundaries, tech debt |
| documentation-writer | API docs, ADRs |

See `.claude/INDEX.md` for full agent list and selection guide.

## Related Documentation

- `.claude/INDEX.md` - Full list of agents, skills, commands
- `docs/PROJECT_PLAN.md` - Master specification (~1200 lines)
- `.claude/CONTEXT.md` - Session paste context
- `.claude/commands/` - Custom slash commands (/review, /migration-new, etc.)
