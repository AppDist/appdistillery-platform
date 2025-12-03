# ADR 0005: Cookie-Based Tenant Context

## Status
Accepted

## Date
2025-12-01

## Context
AppDistillery supports multi-tenancy where users can belong to multiple tenants (households, organizations) and switch between them. The system needs to track which tenant is "active" for each user session to:
- Scope database queries to the correct tenant (`org_id` filtering)
- Display tenant-specific data in the UI
- Record usage events to the correct tenant

We considered:
1. **URL-based tenant routing** - `/tenant/slug/dashboard` embeds tenant in URL
2. **Subdomain routing** - `tenant-slug.app.com` maps subdomain to tenant
3. **Cookie-based context** - Store `active_tenant_id` in HTTP cookie
4. **Session storage** - Store tenant in server-side session database

## Decision
We will use **cookie-based tenant context** with the `active_tenant_id` cookie:

- **Cookie name**: `active_tenant_id`
- **Cookie value**: UUID of active tenant, or absent/null for Personal mode
- **Cookie attributes**: `httpOnly`, `secure`, `sameSite=lax`, `path=/`
- **Middleware integration**: Read cookie in middleware and auth utilities
- **Tenant switching**: Server Action sets/clears cookie

### Cookie Configuration
```typescript
// packages/core/src/auth/constants.ts
export const ACTIVE_TENANT_COOKIE = 'active_tenant_id';

// Setting cookie in Server Action
export async function switchTenant(tenantId: string | null) {
  const cookieStore = await cookies();

  if (tenantId === null) {
    // Switch to Personal mode
    cookieStore.delete(ACTIVE_TENANT_COOKIE);
  } else {
    // Switch to tenant
    cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
}
```

### Session Context Pattern
```typescript
export interface SessionContext {
  user: UserProfile;
  tenant: Tenant | null;       // NULL for Personal mode
  membership: TenantMember | null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const user = await getUserProfile();
  const activeTenant = await getActiveTenant(); // Reads cookie

  if (!activeTenant) {
    return { user, tenant: null, membership: null };
  }

  const membership = await getMembership(user.id, activeTenant.id);
  return { user, tenant: activeTenant, membership };
}
```

### Tenant Switching Flow
1. User clicks tenant in dropdown
2. Client calls `switchTenant(tenantId)` Server Action
3. Server Action sets `active_tenant_id` cookie
4. Client-side router refresh
5. Middleware reads cookie on next request
6. `getSessionContext()` returns new active tenant

## Consequences

### Positive
- **Clean URLs** - No tenant slug in URL, user sees `/dashboard` not `/tenant/acme/dashboard`
- **Persistent context** - Cookie survives page refreshes and navigation
- **Secure** - `httpOnly` prevents JavaScript access, XSS protection
- **Simple implementation** - Native browser cookie support, no session database needed
- **SSR-friendly** - Middleware and Server Components can read cookie
- **Personal mode support** - Null/absent cookie = Personal mode (no tenant)
- **Multi-device consistency** - Each device/browser tracks its own active tenant

### Negative
- **Cookie size limit** - Only stores UUID (36 bytes), but cookie headers add overhead
- **No cross-device sync** - Active tenant not synced across user's devices
- **CSRF considerations** - `sameSite=lax` provides basic CSRF protection
- **Cookie theft risk** - If cookie stolen, attacker can impersonate tenant context (mitigated by `secure` and short session lifetime)

### Security Considerations

**httpOnly attribute:**
- Prevents JavaScript access via `document.cookie`
- Mitigates XSS attacks that try to steal tenant context

**secure attribute:**
- Cookie only sent over HTTPS in production
- Prevents man-in-the-middle interception

**sameSite=lax:**
- Cookie sent on same-site navigation and top-level GET requests
- Prevents CSRF attacks from cross-origin POST requests
- Allows tenant context to work with OAuth callbacks

**Validation:**
- `getActiveTenant()` validates user is member of tenant before returning
- Server Actions check `user_is_tenant_member()` before operations

### Alternative Approaches Rejected

**URL-based routing (`/tenant/slug/dashboard`):**
- ❌ Verbose URLs
- ❌ Must update URLs when switching tenants
- ❌ Complicates routing configuration

**Subdomain routing (`slug.app.com`):**
- ❌ DNS configuration overhead
- ❌ SSL certificate management per subdomain
- ❌ Doesn't support Personal mode cleanly

**Session database:**
- ❌ Additional database queries on every request
- ❌ Requires cleanup of stale sessions
- ❌ More complex implementation

### Risks
- **Cookie tampering** → Mitigated by server-side validation and RLS policies
- **Session hijacking** → Mitigated by `httpOnly`, `secure`, and JWT expiry
- **Cross-device confusion** → Acceptable trade-off for implementation simplicity

## References
- `packages/core/src/auth/constants.ts` - Cookie name constant
- `packages/core/src/auth/index.ts` - Session context with active tenant
- `packages/core/src/auth/get-active-tenant.ts` - Cookie reading logic
- `packages/core/src/auth/actions/switch-tenant.ts` - Cookie setting logic
- `apps/web/src/middleware.ts` - Middleware integration
- `tasks/completed/TASK-1-04-org-switcher.md` - Implementation details
