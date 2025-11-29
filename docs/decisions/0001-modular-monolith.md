# ADR 0001: Modular Monolith Architecture

## Status
Accepted

## Date
2025-11-29

## Context
AppDistillery needs an architecture that supports multiple modules (Agency, Communication Tracker, Marketing, Task Tracker) while remaining simple to deploy and maintain for a small team.

We considered:
1. **Microservices** - Too complex for a small team, operational overhead
2. **Pure monolith** - No clear boundaries, harder to evolve
3. **Modular monolith** - Best of both worlds

## Decision
We will use a **modular monolith architecture** with:

- **Single deployable Next.js application** via Vercel
- **Clear module boundaries** enforced by directory structure (`modules/agency/`, `modules/tasks/`, etc.)
- **Shared Core services** in `packages/core/` (auth, brain, ledger, modules)
- **Turborepo** for workspace management and build orchestration
- **pnpm workspaces** for package resolution

### Module Rules
1. Modules own their routes (`/agency/*` belongs to agency module)
2. Modules own their schema (`agency_*` tables reference `org_id` from Core)
3. Modules call Core services (`brainHandle()`, `recordUsage()`)
4. No cross-module imports (use events or Core APIs instead)
5. Shared UI lives in `packages/ui/`

## Consequences

### Positive
- Simpler deployment and operations (single Vercel project)
- Faster development cycle (no network boundaries)
- Easy to reason about data flow
- Modules can be extracted to microservices later if needed
- Shared authentication and billing infrastructure

### Negative
- Must maintain discipline around module boundaries
- All modules scale together (can't scale one independently)
- Single point of failure (mitigated by Vercel's infrastructure)

### Risks
- Module boundaries may blur over time → Mitigated by lint rules and code review
- Performance bottlenecks → Mitigated by caching and database optimization

## References
- [Modular Monolith: A Primer](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer)
- [The Majestic Monolith](https://m.signalvnoise.com/the-majestic-monolith/)
