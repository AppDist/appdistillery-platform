---
id: TASK-1-01
title: Supabase Auth integration
priority: P1-High
complexity: 3
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-01
completed: 2025-12-01
---

# TASK-1-01: Supabase Auth integration

## Description

Integrate Supabase Auth with Next.js 15 using SSR patterns, including sign-up, sign-in, and session management.

## Acceptance Criteria

- [x] @supabase/ssr installed and configured
- [x] Supabase client utilities created (browser + server)
- [x] Auth middleware for protected routes
- [x] Sign-up page with email/password
- [x] Sign-in page with email/password
- [x] Sign-out functionality
- [x] Session refresh in middleware
- [x] Auth state available in Server Components

## Technical Notes

Use Supabase SSR package for Next.js 15:

1. **Client utilities**:
   - `createBrowserSupabaseClient()` for Client Components
   - `createServerSupabaseClient()` for Server Components/Actions
   - Cookie handling with Next.js cookies()

2. **Middleware** for:
   - Session refresh
   - Protected route redirects
   - Cookie management

3. **Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new format)

### Files Created/Modified

**Core Package:**
- `packages/core/src/auth/supabase-browser.ts` - Browser client
- `packages/core/src/auth/supabase-server.ts` - Server client
- `packages/core/src/auth/middleware.ts` - Auth middleware helper
- `packages/core/src/auth/errors.ts` - Error message sanitization
- `packages/core/src/auth/client.ts` - Client-safe exports
- `packages/core/src/auth/index.ts` - Main exports + getSessionContext

**Web App:**
- `apps/web/src/middleware.ts` - Next.js middleware
- `apps/web/src/app/(auth)/layout.tsx` - Auth layout
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(auth)/login/login-form.tsx` - Login form
- `apps/web/src/app/(auth)/signup/page.tsx` - Signup page
- `apps/web/src/app/(auth)/signup/signup-form.tsx` - Signup form
- `apps/web/src/app/(auth)/actions.ts` - Sign-out action
- `apps/web/src/app/auth/callback/route.ts` - Auth callback
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Dashboard page
- `apps/web/src/components/auth/sign-out-button.tsx` - Sign out button

### Import Patterns

```typescript
// Server Components/Actions - use full auth module
import { createServerSupabaseClient, getSessionContext } from '@appdistillery/core/auth'

// Client Components - use client subpath (no server code)
import { createBrowserSupabaseClient, getAuthErrorMessage } from '@appdistillery/core/auth/client'
```

## Dependencies

- **Blocked by**: TASK-0-04 (Supabase local) - COMPLETED
- **Blocks**: TASK-1-02 (Organizations), TASK-1-03 (Org creation)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-01 | Implementation started |
| 2025-12-01 | Core auth utilities created |
| 2025-12-01 | Middleware and auth pages implemented |
| 2025-12-01 | Code review and security audit completed |
| 2025-12-01 | Fixed: duplicate clients, open redirect, error sanitization |
| 2025-12-01 | All tests passing (27/27), build successful |
| 2025-12-01 | Task completed |

## Notes

- Uses new `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` format (not legacy anon key)
- `getSessionContext()` returns placeholder org data - real implementation needed in TASK-1-02
- Open redirect vulnerability fixed in auth callback
- Error messages sanitized before displaying to users
