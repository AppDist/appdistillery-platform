# Architecture Map

## Project Overview

AppDistillery Platform is a **modular monolith SaaS** built with Turborepo. It provides AI-powered tools for consultancies, starting with scope generation and proposal drafting.

**Tech Stack:** Next.js 15 + React 19 + Supabase + Vercel AI SDK + TailwindCSS 4

## Repository Structure

```
appdistillery-platform/
├── apps/
│   └── web/                    # Next.js 15 application (App Router)
├── packages/
│   ├── core/                   # Kernel: auth, brain, ledger, modules
│   ├── database/               # Migrations + generated Supabase types
│   └── ui/                     # Shared shadcn/ui components
├── modules/
│   └── agency/                 # First module: Consultancy tool
├── docs/
│   └── PROJECT_PLAN.md         # Master specification (~1200 lines)
├── supabase/                   # Supabase config + migrations
├── .claude/                    # AI context + commands + skills
├── turbo.json                  # Turborepo pipeline config
└── pnpm-workspace.yaml         # Workspace definition
```

## Core Kernel Services

The `@appdistillery/core` package exports four distinct services:

### 1. Auth (`@appdistillery/core/auth`)

**Supabase SSR Integration (TASK-1-01, TASK-1-02):**
- `createBrowserSupabaseClient()` - Browser client for Client Components
- `createServerSupabaseClient()` - Server client for Server Components/Actions
- `updateSession()` - Middleware helper for session refresh
- `getAuthErrorMessage()` - Sanitizes Supabase errors for display
- `getSessionContext()` - Returns user/tenant/membership (real DB queries)
- `getUserTenants()` - Fetches all tenants for authenticated user

**Subpath Exports:**
- `@appdistillery/core/auth` - Full auth module (server-safe)
- `@appdistillery/core/auth/client` - Client-safe exports only (no server-only imports)

**Types (TASK-1-02):**
- `UserProfile` - User identity (id, displayName, email, avatarUrl)
- `Tenant` - Household or organization (type, name, slug, settings)
- `TenantMember` - Membership (tenantId, userId, role, joinedAt)
- `TenantMembership` - Combined tenant + member info
- `TenantType` - 'household' | 'organization'
- `MemberRole` - 'owner' | 'admin' | 'member'

**Account Types:**
| Type | Description | Tenant Required |
|------|-------------|-----------------|
| Personal | Individual user | No (tenant = null) |
| Household | Shared family/friends | Yes (type: household) |
| Organization | Business account | Yes (type: organization) |

**Core Features:**
- User profiles extending auth.users
- Tenants for households and organizations
- Memberships with roles (owner, admin, member)
- Session context with user/tenant/membership
- RLS policy enforcement at database level

### 2. Brain (`@appdistillery/core/brain`)
- AI router - single entry point for all LLM calls
- `brainHandle(task, input)` - returns structured output
- Uses Vercel AI SDK `generateObject()` with Zod schemas
- Provider: Anthropic Claude (via @ai-sdk/anthropic)

### 3. Ledger (`@appdistillery/core/ledger`)
- Usage tracking via append-only `usage_events` table
- `recordUsage(action, tokens, cost)` - tracks all billable operations
- Brain Units (BU) as internal currency
- Query helpers: `getUsageHistory()`, `getUsageSummary()`

**Usage Events Table (TASK-1-07):**
- Tracks AI usage and billable actions per tenant
- `id`, `tenant_id` (nullable for Personal mode), `user_id`
- `action` (format: `module:domain:verb`), `module_id`
- `tokens_input`, `tokens_output`, `tokens_total` (computed)
- `units` (Brain Units for billing), `duration_ms`
- `metadata` JSONB, `created_at`
- RLS policies for tenant isolation + Personal mode access
- Immutable audit records (no UPDATE/DELETE for users)

### 4. Modules (`@appdistillery/core/modules`) - TASK-1-06

**Module Registry System:**
- `getInstalledModules(tenantId)` - Get all installed modules for a tenant
- `isModuleEnabled(tenantId, moduleId)` - Check if specific module is enabled
- `installModule({ moduleId, settings? })` - Install module (admin only)
- `uninstallModule({ moduleId, hardDelete? })` - Uninstall/disable module (admin only)

**Types:**
- `ModuleManifest` - Module definition with routes and usage actions
- `InstalledModule` - Installed module data from database

**Key Features:**
- Tenant-scoped module installations
- Admin-only install/uninstall operations
- Soft delete support (disable vs hard delete)
- Module settings storage per tenant

## Module Structure Pattern

Each module follows this structure:

```
modules/<name>/
├── src/
│   ├── manifest.ts           # Module definition (routes, actions, artifacts)
│   ├── prompts.ts            # AI prompt templates
│   ├── schemas/              # Zod schemas for validation
│   │   ├── intake.ts
│   │   ├── brief.ts
│   │   └── index.ts
│   ├── actions/              # Server Actions
│   │   ├── leads.ts
│   │   ├── briefs.ts
│   │   └── index.ts
│   └── components/           # Module-specific UI
└── package.json
```

## Data Flow

```
UI Form → Server Action → brainHandle() → AI Response → recordUsage() → Supabase
```

1. User submits form data
2. Server Action validates with Zod schema
3. `brainHandle()` sends to AI with structured output schema
4. AI response validated against schema
5. `recordUsage()` records tokens/cost
6. Data saved to Supabase with org_id

## Tenant Isolation

**Critical:** All queries MUST include `org_id` filter.

- Database: RLS policies enforce org isolation
- Application: `getSessionContext()` provides current org_id
- Verification: All table operations must filter by org_id
- UI: Only shows data for current organization

## Existing Functionality

### Agency Module (`modules/agency/`)

**Purpose:** AI-powered consultancy proposal tool

**Features:**
- Lead intake form (client info, challenge description)
- Scope generation (AI suggests deliverables, timeline)
- Proposal drafting (AI generates client-ready proposal)

**Tables:**
- `agency_leads` - Client information
- `agency_briefs` - Processed lead → brief
- `agency_proposals` - Generated proposals

**Usage Actions:**
- `agency:scope:generate` (50 BU)
- `agency:proposal:draft` (100 BU)

## Package Boundaries

**Import Rules:**

| From | Can Import |
|------|------------|
| `apps/web` | `@appdistillery/*`, `modules/*` |
| `packages/core` | `@appdistillery/database` |
| `packages/ui` | Nothing (standalone) |
| `modules/*` | `@appdistillery/*` (not other modules) |

**Cross-Module Communication:**
- Modules CANNOT import from each other directly
- Use Core services for shared functionality
- Future: Event bus for module communication
