---
id: TASK-1-03
title: Account creation flows
priority: P1-High
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-01
completed: 2025-12-01
---

# TASK-1-03: Account creation flows

## Description

Implement account creation flows for all three account types: Personal signup (email only), Household creation, and Organization creation.

## Account Flows

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOWS                              │
└─────────────────────────────────────────────────────────────┘

Personal Account:
  Sign up → Create user_profile → Ready to use (no tenant needed)

Household Creation:
  Personal user → Create Household → Add family members

Organization Creation:
  Personal user → Create Organization → Add team members
```

## Acceptance Criteria

- [x] Personal signup creates user_profile only
- [x] createHousehold Server Action
- [x] createOrganization Server Action
- [x] Household form (name, slug)
- [x] Organization form (name, slug, org_number, billing_email)
- [x] Creator automatically added as 'owner' to tenant_members
- [x] Zod schemas for validation
- [x] Redirect to dashboard after creation

## Technical Notes

### Server Actions

```typescript
// packages/core/src/auth/actions/create-tenant.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Household creation (simpler)
const CreateHouseholdSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
})

export async function createHousehold(data: z.infer<typeof CreateHouseholdSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = CreateHouseholdSchema.parse(data)

  // Create tenant as household
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      type: 'household',
      name: validated.name,
      slug: validated.slug,
    })
    .select()
    .single()

  if (error) throw error

  // Add creator as owner
  await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    })

  return tenant
}

// Organization creation (with business fields)
const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  orgNumber: z.string().optional(),
  billingEmail: z.string().email().optional(),
})

export async function createOrganization(data: z.infer<typeof CreateOrganizationSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = CreateOrganizationSchema.parse(data)

  // Create tenant as organization
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      type: 'organization',
      name: validated.name,
      slug: validated.slug,
      org_number: validated.orgNumber,
      billing_email: validated.billingEmail,
    })
    .select()
    .single()

  if (error) throw error

  // Add creator as owner
  await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    })

  return tenant
}
```

### UI Routes

```
/signup                 → Personal account creation
/(dashboard)/settings   → Create household or organization
/onboarding            → Optional tenant setup after signup
```

### Files to Create/Modify

- `packages/core/src/auth/actions/create-tenant.ts` - Server Actions
- `packages/core/src/auth/schemas/tenant.ts` - Zod schemas
- `apps/web/src/app/(auth)/signup/page.tsx` - Personal signup
- `apps/web/src/app/(dashboard)/settings/create-tenant.tsx` - Tenant creation forms

### Patterns to Follow

- Use Server Actions for mutations
- Validate with Zod before database operations
- Personal users can later create/join tenants
- Return typed responses

## Dependencies

- **Blocked by**: TASK-1-01 (Auth), TASK-1-02 (Tenants table)
- **Blocks**: TASK-1-04 (Tenant switcher)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2024-11-30 | Updated: Added Personal/Household/Organization flows |
| 2025-12-01 | Completed: Implemented Server Actions, Zod schemas, UI forms, tests (32 test cases) |
