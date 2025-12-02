# AppDistillery Platform

A modular micro-SaaS platform where users subscribe to individual modules on top of a shared Core kernel. Built with Next.js 15, Supabase, and AI-powered features.

## Overview

AppDistillery is a **modular monolith** architecture that enables:

- **Shared Core**: Authentication, AI routing (Brain), usage metering (Ledger), module registry
- **Pluggable Modules**: Independent features that users can subscribe to individually
- **Multi-Tenant Isolation**: All data scoped by `org_id` with RLS enforcement

**Current Focus**: v0.1 - Core Kernel + Agency Module (consultancy tool)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS v4, shadcn/ui |
| **Database** | Supabase (Postgres, EU region) with Row Level Security |
| **AI** | Vercel AI SDK + Anthropic/OpenAI via `brainHandle()` |
| **Validation** | Zod (shared schemas between UI and server) |
| **Monorepo** | Turborepo with pnpm workspaces |
| **Testing** | Vitest |
| **Deploy** | Vercel |

## Architecture

```
appdistillery-platform/
├── apps/
│   └── web/                    # Next.js 15 application
├── packages/
│   ├── core/                   # Kernel: auth, brain, ledger, modules
│   ├── database/               # Migrations + generated Supabase types
│   └── ui/                     # Shared UI components
├── modules/
│   └── agency/                 # First module: consultancy tool
│       ├── schemas/            # Zod schemas (shared)
│       ├── actions/            # Server actions
│       └── prompts.ts          # AI prompt templates
└── supabase/
    ├── config.toml             # Local dev config
    └── migrations/             # SQL migrations
```

### Data Flow

```
UI → Server Action → Core Service (brainHandle/recordUsage) → Supabase
```

### Core Services

**Brain Router** (`@appdistillery/core/brain`)
- Centralized AI routing with provider abstraction
- Guaranteed structured output via Zod schemas
- Automatic usage tracking

**Usage Ledger** (`@appdistillery/core/ledger`)
- Metered billing per action (Brain Units)
- Module-scoped usage tracking

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- pnpm 8+
- Supabase CLI
- Docker (for local Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/AppDist/appdistillery-platform.git
cd appdistillery-platform

# Install dependencies
pnpm install

# Copy environment variables (note: goes in apps/web/, not root)
cp .env.example apps/web/.env.local

# Start local Supabase
supabase start

# Run database migrations
supabase db reset

# Generate TypeScript types
pnpm db:generate

# Start development server
pnpm dev
```

### Environment Variables

Environment variables live in `apps/web/.env.local` (not root). See `.env.example` for the template.

```bash
# Supabase (new key format)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

# AI Provider
ANTHROPIC_API_KEY=your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Why `apps/web/`?** Next.js only loads `.env.local` from its own directory, not the monorepo root. Each app in a monorepo owns its environment config.

## Development

### Commands

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

# Single package
pnpm --filter @appdistillery/web dev
pnpm --filter @appdistillery/core test
```

### Database Migrations

**Never edit schema in Supabase Dashboard.** Always use migrations:

```bash
# Create new migration
supabase migration new add_feature_table

# Apply migrations locally
supabase db reset

# Generate types after schema changes
pnpm db:generate
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Core tables | `public.<entity>` | `organizations`, `usage_events` |
| Module tables | `public.<module>_<entity>` | `agency_leads`, `agency_briefs` |
| Usage actions | `<module>:<domain>:<verb>` | `agency:scope:generate` |
| Brain tasks | `<module>.<task>` | `agency.scope` |
| Zod schemas | `<Entity>Schema` | `LeadIntakeSchema` |

## Key Principles

### Multi-Tenant Isolation

Every database query must include `org_id` filter:

```typescript
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('org_id', org.id)  // Required!
```

### AI Integration

Always use `brainHandle()` with Zod schemas - never call providers directly:

```typescript
import { brainHandle } from '@appdistillery/core/brain';

const result = await brainHandle({
  orgId: org.id,
  moduleId: 'agency',
  taskType: 'agency.scope',
  schema: ScopeResultSchema,  // Guarantees typed output
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userPrompt,
});
```

### Shared Schemas

Import Zod schemas from modules - never duplicate:

```typescript
import { LeadIntakeSchema } from '@/modules/agency/schemas/intake';
```

## Claude Code Integration

This project includes optimized Claude Code skills in `.claude/skills/`:

- **supabase**: Multi-tenant query patterns, RLS, migrations
- **ai-llm-setup**: brainHandle patterns, provider configs
- **nextjs**: App Router, Server Components, SSR
- **And more**: tailwindcss, shadcn, testing, debugging

Start sessions with context from `.claude/CONTEXT.md`.

## Project Documentation

- **[PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** - Full specifications and roadmap
- **[ADRs](docs/decisions/)** - Architecture Decision Records
- **[CLAUDE.md](CLAUDE.md)** - Quick reference for AI assistants

## License

Private - All rights reserved.

---

Built with [Claude Code](https://claude.ai/code)
