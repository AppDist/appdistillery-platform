---
id: TASK-1-04
title: Tenant switcher
priority: P2-Medium
complexity: 2
module: web
status: BACKLOG
created: 2024-11-30
---

# TASK-1-04: Tenant switcher

## Description

Create tenant switcher component for users with multiple tenants (households or organizations), storing active tenant in cookie/session. Also shows "Personal" mode for users not in a tenant context.

## Acceptance Criteria

- [ ] TenantSwitcher dropdown component
- [ ] List user's tenants (households + organizations)
- [ ] "Personal" option for tenant-free mode
- [ ] Current tenant/personal indicator
- [ ] Switch tenant updates cookie/session
- [ ] Middleware reads active tenant
- [ ] Create new household/organization options

## Technical Notes

Active tenant tracking:
1. Store in cookie: `active_tenant_id` (null = personal mode)
2. Middleware reads and validates
3. Server Components access via helper

### Component Structure

```typescript
// TenantSwitcher component
'use client'

import { useRouter } from 'next/navigation'

interface TenantSwitcherProps {
  tenants: Tenant[]
  activeTenantId: string | null  // null = personal mode
  user: UserProfile
}

export function TenantSwitcher({
  tenants,
  activeTenantId,
  user
}: TenantSwitcherProps) {
  const router = useRouter()

  const handleSwitch = async (tenantId: string | null) => {
    await switchTenant(tenantId)
    router.refresh()
  }

  return (
    <DropdownMenu>
      {/* Personal mode option */}
      <DropdownMenuItem onClick={() => handleSwitch(null)}>
        Personal ({user.email})
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Tenant list */}
      {tenants.map(tenant => (
        <DropdownMenuItem
          key={tenant.id}
          onClick={() => handleSwitch(tenant.id)}
        >
          {tenant.name}
          <Badge>{tenant.type}</Badge>
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />

      {/* Create options */}
      <DropdownMenuItem>Create Household</DropdownMenuItem>
      <DropdownMenuItem>Create Organization</DropdownMenuItem>
    </DropdownMenu>
  )
}
```

### Files to Create/Modify

- `packages/ui/src/components/tenant-switcher.tsx` - Switcher component
- `packages/core/src/auth/actions/switch-tenant.ts` - Switch action
- `packages/core/src/auth/get-active-tenant.ts` - Get active tenant helper
- `apps/web/src/middleware.ts` - Read active tenant cookie

### Patterns to Follow

- Use shadcn DropdownMenu
- Server Action to update cookie
- Refresh router after switch
- Support null tenant (personal mode)

## Dependencies

- **Blocked by**: TASK-1-03 (Account creation flows)
- **Blocks**: None (enhances UX)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2024-11-30 | Updated: Renamed from org switcher to tenant switcher |
