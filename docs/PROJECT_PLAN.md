# AppDistillery Platform — Master Project Plan v1.1

> **Purpose:** This document is the single source of truth for the AppDistillery platform development. Use it as context for Claude Code, Cursor, and any AI coding agents.

---

## 1. Executive Summary

### Vision
AppDistillery is a **modular micro-SaaS platform** where private and business users can subscribe to individual modules (micro-apps) on top of a shared Core. A central **Brain** provides AI capabilities across all modules, with usage metered transparently via pooled currency (**Brain Units / BUs**).

### v0.1 Priorities
1. **Build a thin Core Kernel** — Identity, Module Registry, Usage Ledger, Brain Router
2. **Ship the Agency Module first** — Your own consultancy tool (dogfooding + immediate revenue)
3. **Design for future modules** — Communication Tracker, Marketing, Task Tracker as "slots" only

### Key Differentiators
- **EU-first architecture** — Data residency compliance built-in
- **BYOM (Bring Your Own Model)** — Optional local/hosted LLMs (post-MVP)
- **Unified Usage Pool (BUs)** — Transparent, pooled credits across all modules
- **Modular monolith** — Clean separation, future extraction possible

### Target ICP (v1)
Solo consultants & small agencies (EU focus: Norway + Portugal)

---

## 2. Architecture Overview

### 2.1 Architecture Style
**Modular Monolith** with strict boundaries:
- Single deployable unit (Next.js + Supabase)
- Clear module boundaries enforced by directory structure
- Core services as shared packages
- Designed for future extraction if needed

### 2.2 Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 15 (App Router), React 19 | Server Components + Server Actions |
| **Styling** | TailwindCSS, shadcn/ui | Design system consistency |
| **State** | TanStack Query (server), Zustand (client) | Minimal client state |
| **Database** | Supabase (Postgres, EU) | RLS for tenant isolation |
| **Auth** | Supabase Auth | Magic links + OAuth later |
| **AI** | Vercel AI SDK + Anthropic | `generateObject` for structured output |
| **Validation** | Zod | Shared schemas between UI and actions |
| **Testing** | Vitest | Core logic coverage |
| **Observability** | Sentry, PostHog | Errors + product analytics |
| **Deployment** | Vercel (EU region) | Zero-config deployment |

### 2.3 Directory Structure

```
appdistillery/
├── apps/
│   └── web/                          # Next.js application
│       ├── app/
│       │   ├── (auth)/               # Auth routes (login, signup)
│       │   │   ├── login/page.tsx
│       │   │   └── signup/page.tsx
│       │   ├── (dashboard)/          # Authenticated shell
│       │   │   ├── layout.tsx        # Nav, org switcher
│       │   │   ├── page.tsx          # Dashboard home
│       │   │   ├── settings/
│       │   │   └── usage/            # Usage dashboard
│       │   ├── (modules)/            # Module routes
│       │   │   └── agency/           # Agency module
│       │   │       ├── page.tsx      # Pipeline
│       │   │       ├── intake/
│       │   │       ├── briefs/[id]/
│       │   │       └── proposals/[id]/
│       │   ├── api/
│       │   │   └── trpc/[trpc]/      # tRPC handler
│       │   └── layout.tsx            # Root layout
│       ├── components/
│       │   ├── ui/                   # shadcn components
│       │   └── shared/               # App-wide components
│       └── lib/
│           ├── supabase/             # Supabase clients
│           └── trpc/                 # tRPC setup
│
├── packages/
│   ├── core/                         # Core Kernel
│   │   ├── auth/                     # Auth helpers
│   │   │   └── index.ts
│   │   ├── brain/                    # AI Router
│   │   │   ├── index.ts
│   │   │   ├── providers/
│   │   │   │   └── anthropic.ts      # Single provider for MVP
│   │   │   └── types.ts
│   │   ├── ledger/                   # Usage Ledger
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── modules/                  # Module Registry
│   │   │   ├── registry.ts
│   │   │   └── types.ts
│   │   └── index.ts                  # Public exports
│   │
│   ├── database/                     # Schema & migrations
│   │   ├── migrations/               # Supabase migrations
│   │   ├── types.ts                  # Generated types
│   │   └── index.ts
│   │
│   └── ui/                           # Shared UI components
│       ├── components/
│       └── hooks/
│
├── modules/                          # Module implementations
│   └── agency/                       # Agency/Consultancy module
│       ├── manifest.ts               # Module definition
│       ├── prompts.ts                # AI prompt templates
│       ├── schemas/                  # Zod schemas (SHARED)
│       │   ├── intake.ts             # LeadIntakeSchema
│       │   ├── brief.ts              # BriefSchema, ScopeResultSchema
│       │   └── proposal.ts           # ProposalSchema
│       ├── actions/                  # Server actions
│       │   ├── leads.ts
│       │   ├── briefs.ts
│       │   └── proposals.ts
│       └── components/               # Module-specific UI
│           ├── pipeline-board.tsx
│           └── proposal-editor.tsx
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MODULE_MANIFEST.md
│   └── decisions/                    # ADRs
│       └── 0001-modular-monolith.md
│
├── .claude/                          # AI agent context
│   └── CONTEXT.md                    # Paste at session start
│
├── supabase/                         # Supabase config
│   ├── config.toml
│   └── migrations/                   # Link to packages/database/migrations
│
├── turbo.json                        # Turborepo config
├── package.json
└── pnpm-workspace.yaml
```

### 2.4 Module Boundary Rules

1. **Modules own their routes** — `/agency/*` belongs to the agency module
2. **Modules own their schema** — `agency_*` tables reference `org_id` from Core
3. **Modules call Core services** — `brain.handle()`, `ledger.record()`, never direct DB writes to Core tables
4. **No cross-module imports** — If agency needs data from tasks, use events or Core APIs
5. **Shared UI in packages/ui** — Modules can use but not modify
6. **Zod schemas in modules/*/schemas/** — Same schema for UI forms AND server actions

### 2.5 Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Tables (Core)** | `public.<entity>` | `organizations`, `usage_events` |
| **Tables (Module)** | `public.<module>_<entity>` | `agency_leads`, `agency_briefs` |
| **Usage Actions** | `<module>:<domain>:<verb>` | `agency:scope:generate` |
| **Brain Task Types** | `<module>.<task>` | `agency.scope`, `agency.proposal` |
| **Zod Schemas** | `<Entity>Schema` | `LeadIntakeSchema`, `ScopeResultSchema` |

### 2.6 Database Workflow

> **⚠️ CRITICAL: Never use Supabase Dashboard Table Editor**

All schema changes go through migrations:

```bash
# Create a new migration
supabase migration new <migration_name>

# Edit the generated SQL file in supabase/migrations/

# Apply locally
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > packages/database/types.ts

# Push to remote (when ready)
supabase db push
```

---

## 3. Core Kernel Specification

### 3.1 Identity & Tenancy

**Purpose:** Multi-tenant user and account management with strict isolation supporting three account types.

#### Account Types

| Type | Description | Usage Pool |
|------|-------------|------------|
| **Personal** | Individual user, email only | Per-user |
| **Household** | Shared group (family/friends) | Shared pool |
| **Organization** | Business with org numbers | Shared pool |

**Key Design Decisions:**
- Personal users can use the platform without creating a tenant
- Personal users can later create or join Households/Organizations
- Tenants (Households + Organizations) share usage pools
- RLS policies support both personal (user_id) and tenant (tenant_id) isolation

**Tables:**

```sql
-- User profiles (extends Supabase Auth)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (households + organizations)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('household', 'organization')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- Organization-specific fields (null for households)
  org_number TEXT,        -- Business registration number
  billing_email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant members (user <-> tenant relationship)
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

-- Users can see tenants they belong to
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

-- Users can see their own memberships
CREATE POLICY "Users can view their memberships" ON public.tenant_members
  FOR SELECT USING (user_id = auth.uid());
```

**TypeScript Interface:**

```typescript
// packages/core/auth/types.ts
export type TenantType = 'household' | 'organization';

export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface Tenant {
  id: string;
  type: TenantType;
  name: string;
  slug: string;
  orgNumber: string | null;    // Only for organizations
  billingEmail: string | null;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface TenantMember {
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface SessionContext {
  user: UserProfile;
  tenant?: Tenant;            // Optional - personal users may not have a tenant
  membership?: TenantMember;  // Optional - only if in a tenant
}
```

### 3.2 Module Registry

**Purpose:** Track which modules exist and which are installed for each organization.

**Tables:**

```sql
-- Module definitions
CREATE TABLE public.modules (
  id TEXT PRIMARY KEY,                    -- e.g., 'agency', 'tasks'
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,                -- Full module manifest
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'coming_soon', 'deprecated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module installations per org
CREATE TABLE public.installations (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',            -- Org-specific module config
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, module_id)
);

-- RLS
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org installations" ON public.installations
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );
```

**Module Manifest Type:**

```typescript
// packages/core/modules/types.ts
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  
  routes: {
    root: string;
    pages: Array<{
      path: string;
      title: string;
      icon?: string;
    }>;
  };
  
  usage: {
    actions: Array<{
      key: string;           // e.g., 'agency:scope:generate'
      unitCost: number;      // Brain Units cost
      description: string;
    }>;
  };
  
  artifacts?: string[];      // Artifact kinds this module creates
}
```

**Core Helpers:**

```typescript
// packages/core/modules/registry.ts
export async function getInstalledModules(orgId: string): Promise<ModuleManifest[]>;
export async function getModuleManifest(moduleId: string): Promise<ModuleManifest | null>;
export async function canAccessModule(orgId: string, moduleId: string): Promise<boolean>;
export async function installModule(orgId: string, moduleId: string): Promise<void>;
```

### 3.3 Usage Ledger v1

**Purpose:** Immutable record of all billable actions for metering and billing.

**v0.1 Scope:**
- `usage_events` table — append-only event log ✅
- `usage_pools` table — **DEFERRED to Phase 3** (caps, balance management)
- Simple usage history view ✅

**Tables:**

```sql
-- Usage events (append-only) — PHASE 1
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id),
  module_id TEXT NOT NULL,
  action TEXT NOT NULL,                   -- e.g., 'agency:scope:generate'
  units INTEGER NOT NULL DEFAULT 1,       -- Brain Units consumed
  tokens INTEGER,                         -- LLM tokens (if applicable)
  duration_ms INTEGER,                    -- Execution time
  metadata JSONB DEFAULT '{}',            -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX idx_usage_events_org_created ON public.usage_events(org_id, created_at DESC);
CREATE INDEX idx_usage_events_module ON public.usage_events(module_id, created_at DESC);

-- RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org usage" ON public.usage_events
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Usage pools — PHASE 3 (DEFERRED)
-- CREATE TABLE public.usage_pools (
--   org_id UUID PRIMARY KEY REFERENCES public.organizations(id),
--   balance INTEGER NOT NULL DEFAULT 0,
--   soft_cap INTEGER DEFAULT 5000,
--   hard_cap INTEGER DEFAULT 10000,
--   renews_at TIMESTAMPTZ,
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
```

**Ledger SDK:**

```typescript
// packages/core/ledger/types.ts
export interface RecordUsageInput {
  orgId: string;
  userId?: string;
  moduleId: string;
  action: string;
  units?: number;
  tokens?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

// packages/core/ledger/index.ts
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  // Insert usage_event row
  // Phase 3: Also decrement pool balance and check caps
}

export async function getUsageHistory(
  orgId: string, 
  limit?: number
): Promise<UsageEvent[]>;

// Phase 3: export async function getUsageBalance(orgId: string): Promise<UsageBalance>;
```

### 3.4 Brain / AI Router v1

**Purpose:** Single entry point for all AI operations with structured output and usage logging.

**v0.1 Scope:**
- Single provider (Anthropic Claude)
- Vercel AI SDK for structured output (`generateObject`)
- No policy profiles (all STANDARD)
- No BYOM yet
- No PII handling yet

**Implementation Note:**
> Use the **Vercel AI SDK Core** (`generateObject` from `ai` package).
> - Do NOT write raw HTTP fetchers for Anthropic/OpenAI
> - Use `generateObject` with a Zod schema to guarantee valid JSON
> - This eliminates "Return ONLY valid JSON" prompt hacking

**Types:**

```typescript
// packages/core/brain/types.ts
import { z } from 'zod';

export interface BrainTask<T extends z.ZodType = z.ZodType> {
  orgId: string;
  moduleId: string;
  taskType: string;           // e.g., 'agency.scope', 'agency.proposal'
  systemPrompt: string;
  userPrompt: string;
  schema: T;                  // Zod schema for output validation
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

export interface BrainResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage: {
    tokens?: number;
    durationMs: number;
  };
}
```

**Brain Handler:**

```typescript
// packages/core/brain/index.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { recordUsage } from '../ledger';
import type { BrainTask, BrainResult } from './types';
import { z } from 'zod';

export async function brainHandle<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<BrainResult<z.infer<T>>> {
  const startTime = Date.now();
  
  try {
    // Use Vercel AI SDK generateObject for structured output
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: task.schema,
      system: task.systemPrompt,
      prompt: task.userPrompt,
      maxTokens: task.options?.maxTokens ?? 2000,
      temperature: task.options?.temperature ?? 0.7,
    });
    
    const durationMs = Date.now() - startTime;
    const tokens = result.usage?.totalTokens;
    
    // Record usage to ledger
    await recordUsage({
      orgId: task.orgId,
      moduleId: task.moduleId,
      action: `brain:${task.taskType}`,
      units: calculateUnits(task.taskType, tokens),
      tokens,
      durationMs,
    });
    
    return {
      success: true,
      data: result.object,
      usage: { tokens, durationMs },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      usage: { durationMs: Date.now() - startTime },
    };
  }
}

function calculateUnits(taskType: string, tokens?: number): number {
  // Simple mapping for now
  const costMap: Record<string, number> = {
    'agency.scope': 50,
    'agency.proposal': 100,
  };
  return costMap[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}
```

---

## 4. Agency Module Specification

### 4.1 Purpose
The Agency module is **AppDistillery's consultancy tool** — used internally for your own consulting business. It provides:
- Lead capture and qualification
- AI-assisted project scoping
- Automated proposal generation
- Pipeline management

### 4.2 Human-in-the-Loop Boundaries

| AI Generates | Human Must |
|--------------|------------|
| Initial scope analysis (`ai_analysis`) | Review and edit before client sees |
| Proposal skeleton (phases, pricing suggestion) | Adjust pricing and assumptions |
| Markdown draft | Polish language and add custom sections |
| — | Approve proposal before `status = 'sent'` |

> **Rule:** AI provides first drafts. Human approves all client-facing output.

### 4.3 Module Manifest

```typescript
// modules/agency/manifest.ts
export const agencyManifest: ModuleManifest = {
  id: 'agency',
  name: 'AppDistillery Agency',
  version: '0.1.0',
  description: 'AI-powered consultancy intake, scoping, and proposals',
  
  routes: {
    root: '/agency',
    pages: [
      { path: '/agency', title: 'Pipeline', icon: 'Briefcase' },
      { path: '/agency/intake', title: 'New Lead', icon: 'UserPlus' },
      { path: '/agency/briefs', title: 'Briefs', icon: 'FileText' },
      { path: '/agency/proposals', title: 'Proposals', icon: 'FileSignature' },
    ],
  },
  
  usage: {
    actions: [
      { key: 'agency:scope:generate', unitCost: 50, description: 'AI analysis of client brief' },
      { key: 'agency:proposal:draft', unitCost: 100, description: 'AI-generated proposal' },
    ],
  },
  
  artifacts: ['agency-brief', 'agency-proposal'],
};
```

### 4.4 Zod Schemas (Shared)

```typescript
// modules/agency/schemas/intake.ts
import { z } from 'zod';

export const LeadIntakeSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  source: z.enum(['website', 'referral', 'linkedin', 'other']).default('other'),
  problemDescription: z.string().min(10, 'Please describe the problem'),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
});

export type LeadIntake = z.infer<typeof LeadIntakeSchema>;

// modules/agency/schemas/brief.ts
import { z } from 'zod';

export const ScopeResultSchema = z.object({
  summary: z.string().describe('2-3 sentence executive summary'),
  problemAnalysis: z.string().describe('Deeper analysis of the core problem'),
  risks: z.array(z.string()).describe('Key risks or concerns'),
  approach: z.string().describe('Recommended high-level approach'),
  questions: z.array(z.string()).describe('Clarifying questions for client'),
  complexity: z.enum(['low', 'medium', 'high']),
  estimatedWeeks: z.number().int().positive(),
  recommendedStack: z.array(z.string()).optional(),
});

export type ScopeResult = z.infer<typeof ScopeResultSchema>;

// modules/agency/schemas/proposal.ts
import { z } from 'zod';

export const ProposalResultSchema = z.object({
  executiveSummary: z.string().describe('Compelling 2-paragraph summary'),
  scopePhases: z.array(z.object({
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
    weeks: z.number(),
  })),
  pricing: z.object({
    model: z.enum(['fixed', 'hourly', 'retainer']),
    total: z.number(),
    breakdown: z.array(z.object({
      item: z.string(),
      amount: z.number(),
    })),
  }),
  timeline: z.string(),
  assumptions: z.array(z.string()),
  outOfScope: z.array(z.string()),
});

export type ProposalResult = z.infer<typeof ProposalResultSchema>;
```

### 4.5 Domain Schema

```sql
-- Agency leads (potential clients)
CREATE TABLE public.agency_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  client_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  source TEXT,                            -- website, referral, linkedin, etc.
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'proposal', 'won', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency briefs (scoped requirements)
CREATE TABLE public.agency_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  lead_id UUID REFERENCES public.agency_leads(id),
  title TEXT NOT NULL,
  raw_input TEXT,                         -- Original client description
  problem_statement TEXT,
  goals JSONB,                            -- Extracted/refined goals
  constraints JSONB,                      -- Budget, timeline, tech constraints
  ai_analysis JSONB,                      -- Brain's structured analysis (ScopeResult)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'ready')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency proposals
CREATE TABLE public.agency_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  brief_id UUID REFERENCES public.agency_briefs(id),
  title TEXT NOT NULL,
  executive_summary TEXT,
  scope_items JSONB,                      -- ProposalResult.scopePhases
  pricing JSONB,                          -- ProposalResult.pricing
  timeline TEXT,
  assumptions TEXT,
  out_of_scope TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'accepted', 'rejected')),
  content_markdown TEXT,                  -- Full rendered proposal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for all agency tables
ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can access leads" ON public.agency_leads
  FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org members can access briefs" ON public.agency_briefs
  FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org members can access proposals" ON public.agency_proposals
  FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
```

### 4.6 AI Prompts

```typescript
// modules/agency/prompts.ts

export const SCOPING_SYSTEM_PROMPT = `You are a Senior Solutions Architect analyzing a client's project requirements.
Your task is to provide a structured assessment that helps scope the engagement.
Be specific, actionable, and realistic about complexity and timeline.`;

export const SCOPING_USER_TEMPLATE = (input: {
  problemStatement: string;
  goals?: string[];
  budgetRange?: string;
  timeline?: string;
  technicalConstraints?: string;
}) => `Analyze this project brief:

**Problem Statement:**
${input.problemStatement}

**Client Goals:**
${input.goals?.join(', ') || 'Not specified'}

**Constraints:**
- Budget: ${input.budgetRange || 'Not specified'}
- Timeline: ${input.timeline || 'Not specified'}
- Technical: ${input.technicalConstraints || 'None specified'}

Provide your analysis following the required schema.`;

export const PROPOSAL_SYSTEM_PROMPT = `You are crafting a professional consultancy proposal.
Be specific, actionable, and value-focused. Price fairly but profitably.
Structure the work in clear phases with concrete deliverables.`;

export const PROPOSAL_USER_TEMPLATE = (input: {
  briefAnalysis: ScopeResult;
  hourlyRate: number;
  pricingModel: 'fixed' | 'hourly' | 'retainer';
}) => `Generate a proposal based on this analysis:

**Scope Analysis:**
${JSON.stringify(input.briefAnalysis, null, 2)}

**Pricing Guidelines:**
- Hourly rate: €${input.hourlyRate}
- Preferred model: ${input.pricingModel}

Create a compelling proposal following the required schema.`;
```

### 4.7 Server Actions (Example)

```typescript
// modules/agency/actions/briefs.ts
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { getSessionContext } from '@appdistillery/core/auth';
import { createClient } from '@/lib/supabase/server';
import { ScopeResultSchema } from '../schemas/brief';
import { SCOPING_SYSTEM_PROMPT, SCOPING_USER_TEMPLATE } from '../prompts';

export async function generateScope(briefId: string) {
  const { org, user } = await getSessionContext();
  const supabase = await createClient();
  
  // 1. Fetch the brief
  const { data: brief, error } = await supabase
    .from('agency_briefs')
    .select('*')
    .eq('id', briefId)
    .eq('org_id', org.id)
    .single();
  
  if (error || !brief) {
    throw new Error('Brief not found');
  }
  
  // 2. Call Brain with Zod schema
  const result = await brainHandle({
    orgId: org.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    systemPrompt: SCOPING_SYSTEM_PROMPT,
    userPrompt: SCOPING_USER_TEMPLATE({
      problemStatement: brief.raw_input || brief.problem_statement || '',
      goals: brief.goals,
      budgetRange: brief.constraints?.budget,
      timeline: brief.constraints?.timeline,
    }),
    schema: ScopeResultSchema,  // Guarantees valid output
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Scope generation failed');
  }
  
  // 3. Update brief with analysis
  await supabase
    .from('agency_briefs')
    .update({
      ai_analysis: result.data,
      status: 'analyzed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', briefId);
  
  return result.data;
}
```

### 4.8 User Flows

#### Flow 1: Lead Intake
```
Route: /agency/intake
→ Form validates with LeadIntakeSchema (same schema client & server)
→ Creates agency_leads + agency_briefs
→ Redirects to /agency/briefs/[id]
```

#### Flow 2: AI Scoping
```
Route: /agency/briefs/[id]
→ Display raw input + editable fields
→ Button: "Generate AI Analysis"
→ Calls generateScope() server action
→ brainHandle() with ScopeResultSchema guarantees valid JSON
→ Records usage: 'agency:scope:generate' (50 BUs)
→ Display analysis cards (summary, risks, approach, questions)
→ Human reviews and edits before proceeding
```

#### Flow 3: Proposal Generation
```
Route: /agency/proposals/[id]
→ Create proposal from brief
→ Button: "AI Draft"
→ Calls generateProposal() with ProposalResultSchema
→ Records usage: 'agency:proposal:draft' (100 BUs)
→ Populates structured fields + content_markdown
→ Human edits in markdown editor
→ Status: draft → ready → sent → accepted/rejected
```

#### Flow 4: Pipeline View
```
Route: /agency
→ Kanban/table by lead status
→ Columns: New | Qualified | Proposal | Won | Lost
→ Click card → navigate to brief/proposal
```

---

## 5. Roadmap & Phases

### Task Priority Legend

| Tag | Meaning |
|-----|---------|
| **[CORE]** | Must have for dogfooding — cannot ship without |
| **[PLUS]** | Nice to have — cut if time runs low |

### Phase 0: Infrastructure & Shell (Week 1)

**Goal:** Running monolith with tooling ready for AI agents.

| Task | Tag | Description | Acceptance Criteria |
|------|-----|-------------|---------------------|
| 0.1 | [CORE] | Init Turborepo with pnpm | `apps/web`, `packages/core`, `packages/ui` exist |
| 0.2 | [CORE] | Setup Next.js 15 with App Router | Dev server runs |
| 0.3 | [CORE] | Configure Tailwind + shadcn/ui | Button component renders |
| 0.4 | [CORE] | Create Supabase project (EU) | Connection works |
| 0.5 | [CORE] | Setup Supabase CLI + migration flow | `supabase db reset` works |
| 0.6 | [CORE] | Install Vitest | `pnpm test` runs |
| 0.7 | [PLUS] | Install Sentry | Error boundary reports |
| 0.8 | [CORE] | Create `.claude/CONTEXT.md` | AI context file ready |
| 0.9 | [CORE] | Create first ADR | `docs/decisions/0001-modular-monolith.md` |

### Phase 1: Core Kernel v0 (Week 1-2)

**Goal:** User can log in, belong to an org, and system records usage.

| Task | Tag | Description | Acceptance Criteria |
|------|-----|-------------|---------------------|
| 1.1 | [CORE] | Create identity migration | Tables + RLS created |
| 1.2 | [CORE] | Implement auth flow | Login/signup works |
| 1.3 | [CORE] | Build org creation | New user creates org |
| 1.4 | [PLUS] | Build org switcher | Multi-org users can switch |
| 1.5 | [CORE] | Create module tables | `modules`, `installations` exist |
| 1.6 | [CORE] | Implement module helpers | `canAccessModule` works |
| 1.7 | [CORE] | Create usage_events table | Migration + RLS |
| 1.8 | [CORE] | Implement `ledger.record()` | Events inserted correctly |
| 1.9 | [CORE] | Write ledger tests | Vitest tests pass |
| 1.10 | [CORE] | Create Brain types | Interfaces defined |
| 1.11 | [CORE] | Implement Anthropic adapter | Using Vercel AI SDK |
| 1.12 | [CORE] | Implement `brainHandle()` | generateObject + ledger works |
| 1.13 | [CORE] | Write brain tests | Happy path tested |
| 1.14 | [PLUS] | Build usage dashboard | `/usage` shows events |
| 1.15 | [CORE] | **RLS verification test** | 2 orgs, verify isolation |

**Phase 1 Exit Criteria:**
- User can sign up → create org → see dashboard
- `brainHandle()` call → usage_event row created
- RLS prevents cross-org data access

### Phase 2: Agency Module v0 (Week 2-4)

**Goal:** Complete lead → scope → proposal flow.

| Task | Tag | Description | Acceptance Criteria |
|------|-----|-------------|---------------------|
| 2.1 | [CORE] | Create agency tables migration | Tables + RLS created |
| 2.2 | [CORE] | Create agency manifest | Registered in DB |
| 2.3 | [CORE] | Install agency for admin org | Installation record exists |
| 2.4 | [CORE] | Create Zod schemas | `schemas/` folder with all schemas |
| 2.5 | [CORE] | Build intake form | Validates with LeadIntakeSchema |
| 2.6 | [CORE] | Build brief view | Displays brief data |
| 2.7 | [CORE] | Create scoping prompts | `prompts.ts` ready |
| 2.8 | [CORE] | Implement generateScope action | Uses brainHandle + ScopeResultSchema |
| 2.9 | [CORE] | Display AI analysis | Cards render correctly |
| 2.10 | [CORE] | Build proposal creation | Links to brief |
| 2.11 | [CORE] | Implement generateProposal action | Uses ProposalResultSchema |
| 2.12 | [CORE] | Build proposal editor | Markdown editing works |
| 2.13 | [CORE] | Build pipeline view | Kanban/table displays |
| 2.14 | [PLUS] | Add status transitions | UI for status changes |

**Phase 2 Exit Criteria:**
- Create lead → AI scope → draft proposal works end-to-end
- Usage recorded for scope (50 BU) and proposal (100 BU)
- Pipeline shows all leads

### Phase 3: Hardening & Polish (Week 4-5)

**Goal:** Production-ready for internal use.

| Task | Tag | Description | Acceptance Criteria |
|------|-----|-------------|---------------------|
| 3.1 | [PLUS] | Create artifacts table | Registry exists |
| 3.2 | [PLUS] | Link proposals to artifacts | Auto-create works |
| 3.3 | [PLUS] | Build artifacts list | `/artifacts` displays |
| 3.4 | [CORE] | Add error handling | Graceful Brain errors |
| 3.5 | [CORE] | Add loading states | Skeletons for async |
| 3.6 | [CORE] | Add form validation | Zod errors display |
| 3.7 | [CORE] | Add toast notifications | Success/error feedback |
| 3.8 | [PLUS] | Proposal export | Copy markdown |
| 3.9 | [PLUS] | Usage pools + caps | `usage_pools` table + enforcement |
| 3.10 | [CORE] | Mobile responsive | Core flows work on mobile |
| 3.11 | [PLUS] | Seed demo data | Script for demo org |
| 3.12 | [PLUS] | Write E2E test | Playwright for happy path |

**Phase 3 Exit Criteria:**
- Agency module usable for real consulting deals
- No critical bugs in core flows

---

## 6. Testing Strategy

### What to Test

| Layer | Test Type | Coverage Target |
|-------|-----------|-----------------|
| **Core: Ledger** | Unit (Vitest) | 90%+ |
| **Core: Brain** | Unit (Vitest) | 80%+ |
| **Core: Auth helpers** | Unit (Vitest) | 80%+ |
| **Agency: Server actions** | Integration | Happy paths |
| **Full flow** | E2E (Playwright) | 1 happy path |

### Definition of "Good Enough"

> Once these tests are green AND the flows work from the browser, **v0.1 is good enough to dogfood**.

- [ ] `pnpm test` passes for Core package
- [ ] Lead → Brief → Scope → Proposal flow works in browser
- [ ] RLS prevents cross-org access (manual test with 2 users)
- [ ] Usage events appear after Brain calls

---

## 7. Agentic Coding Workflow

### 7.1 Session Setup

At the start of every Claude Code / Cursor session, paste the `CONTEXT.md` file.

### 7.2 Task Prompting

**Good prompt structure:**

```
I'm working on [Phase X, Task Y]: [Task Name]

Context:
- [Relevant schema/types if needed]
- [Dependencies on other tasks]

Please implement:
1. [Specific deliverable]
2. [Specific deliverable]

Acceptance criteria:
- [How to verify it works]
```

### 7.3 Review Checklist

After AI generates code, verify:

- [ ] Uses `org_id` for all tenant-scoped data
- [ ] RLS policies are correct
- [ ] Calls `ledger.record()` for billable actions
- [ ] Calls `brainHandle()` not provider directly
- [ ] Uses `generateObject` with Zod schema (not raw prompts)
- [ ] Zod schemas imported from `modules/*/schemas/`
- [ ] Error handling is present
- [ ] TypeScript types are strict

---

## 8. Out of Scope (v0.1)

These are explicitly deferred:

- ❌ OPA / policy engine
- ❌ Temporal / durable workflows  
- ❌ BYOM (custom model hosting)
- ❌ PII redaction/tokenization
- ❌ Multi-provider routing
- ❌ Communication Tracker implementation
- ❌ Stripe / billing automation
- ❌ Google/WhatsApp integrations
- ❌ Micro-frontends
- ❌ SSO/SAML
- ❌ Usage pools / caps enforcement (Phase 3+)

---

## 9. Success Metrics

### v0.1 Goals

| Metric | Target |
|--------|--------|
| Lead → Proposal time | < 30 minutes |
| Scope generation latency | < 15 seconds |
| Proposal generation latency | < 30 seconds |
| Core test coverage | > 80% |
| Critical bugs | 0 |

### Definition of Done (v0.1)

- [ ] Can sign up and create organization
- [ ] Can capture lead and create brief
- [ ] Can generate AI scope analysis
- [ ] Can draft AI proposal
- [ ] Can view pipeline with all leads
- [ ] Usage is tracked and displayed
- [ ] Works on desktop and mobile
- [ ] No critical errors

---

## Appendix A: Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Provider
ANTHROPIC_API_KEY=xxx

# Observability
SENTRY_DSN=xxx
NEXT_PUBLIC_POSTHOG_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Appendix B: Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@tanstack/react-query": "^5.x",
    "zod": "^3.x",
    "ai": "^4.x",
    "@ai-sdk/anthropic": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^2.x",
    "tailwindcss": "^3.x",
    "@playwright/test": "^1.x",
    "supabase": "^1.x"
  }
}
```

## Appendix C: Local Dev Checklist

```bash
# 1. Clone and install
git clone <repo>
cd appdistillery
pnpm install

# 2. Setup environment
cp .env.example .env.local
# Fill in Supabase and Anthropic keys

# 3. Start Supabase (local) or connect to remote
supabase start  # or use remote project

# 4. Run migrations
supabase db reset

# 5. Generate types
supabase gen types typescript --local > packages/database/types.ts

# 6. Start dev server
pnpm dev
```

## Appendix D: Quick Reference

### Core SDK Imports
```typescript
import { brainHandle } from '@appdistillery/core/brain';
import { recordUsage, getUsageHistory } from '@appdistillery/core/ledger';
import { getInstalledModules, canAccessModule } from '@appdistillery/core/modules';
import { getSessionContext } from '@appdistillery/core/auth';
```

### Agency Schema Imports
```typescript
import { LeadIntakeSchema } from '@/modules/agency/schemas/intake';
import { ScopeResultSchema } from '@/modules/agency/schemas/brief';
import { ProposalResultSchema } from '@/modules/agency/schemas/proposal';
```

---

*Last updated: November 2025*
*Version: 1.1*
