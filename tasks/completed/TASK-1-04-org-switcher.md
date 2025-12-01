---
id: TASK-1-04
title: Tenant switcher
priority: P2-Medium
complexity: 2
module: web
status: DONE
created: 2024-11-30
started: 2025-12-01
completed: 2025-12-01
---

# TASK-1-04: Tenant switcher

## Description

Create tenant switcher component for users with multiple tenants (households or organizations), storing active tenant in cookie/session. Also shows "Personal" mode for users not in a tenant context.

## Acceptance Criteria

- [x] TenantSwitcher dropdown component
- [x] List user's tenants (households + organizations)
- [x] "Personal" option for tenant-free mode
- [x] Current tenant/personal indicator
- [x] Switch tenant updates cookie/session
- [x] Middleware reads active tenant
- [x] Create new household/organization options

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
| 2025-12-01 | Implementation completed |

## Implementation Summary

### Files Created

**Core Auth Package (`packages/core/src/auth/`):**
- `constants.ts` - Cookie configuration constants (`ACTIVE_TENANT_COOKIE`, `COOKIE_MAX_AGE`)
- `transforms.ts` - Database row transformation functions (`transformTenantRow`, `transformMemberRow`)
- `get-active-tenant.ts` - Helper to read active tenant from cookies
- `actions/switch-tenant.ts` - Server Action to switch active tenant
- `actions/switch-tenant.test.ts` - Tests for switch tenant action
- `get-active-tenant.test.ts` - Tests for get active tenant helper

**Web App Components (`apps/web/src/components/`):**
- `ui/dropdown-menu.tsx` - shadcn dropdown-menu component
- `ui/badge.tsx` - shadcn badge component
- `tenants/tenant-switcher.tsx` - TenantSwitcher dropdown component

### Dependencies Added

- `@radix-ui/react-dropdown-menu` ^2.1.16 - Added to `apps/web` for shadcn dropdown-menu component

### New Exports from @appdistillery/core/auth

- `switchTenant` - Server Action to switch active tenant (sets cookie)
- `getActiveTenant` - Helper to read active tenant from cookies

### Implementation Details

**Cookie-Based Tenant Switching:**
- Active tenant stored in `active_tenant_id` cookie
- `switchTenant()` Server Action sets/clears the cookie
- `getActiveTenant()` helper reads and validates the cookie
- `getSessionContext()` updated to include active tenant from cookie

**TenantSwitcher Component:**
- Displays current context (Personal / Tenant name + type)
- Lists all user tenants (households + organizations)
- "Personal" mode option (clears active_tenant_id cookie)
- Visual indicators with badges for tenant types
- Integrated "Create" options for new tenants
- Client-side router refresh after switching

**Transform Layer:**
- Database snake_case → camelCase transformations
- Centralized in `transforms.ts` for consistency
- Used by `getActiveTenant()` and `getUserTenants()`

**Testing:**
- Unit tests for `switchTenant()` action
- Unit tests for `getActiveTenant()` helper
- Tests verify cookie setting/clearing behavior
- Tests verify tenant validation and membership checks

### Integration Points

- Integrated into dashboard header (apps/web/src/app/(authenticated)/dashboard/page.tsx)
- Works with existing `getSessionContext()` and `getUserTenants()` helpers
- Compatible with RLS policies (tenant isolation)
- Supports all tenant types (household, organization) and personal mode
