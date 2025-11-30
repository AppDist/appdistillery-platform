---
id: TASK-1-01
title: Supabase Auth integration
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-01: Supabase Auth integration

## Description

Integrate Supabase Auth with Next.js 15 using SSR patterns, including sign-up, sign-in, and session management.

## Acceptance Criteria

- [ ] @supabase/ssr installed and configured
- [ ] Supabase client utilities created (browser + server)
- [ ] Auth middleware for protected routes
- [ ] Sign-up page with email/password
- [ ] Sign-in page with email/password
- [ ] Sign-out functionality
- [ ] Session refresh in middleware
- [ ] Auth state available in Server Components

## Technical Notes

Use Supabase SSR package for Next.js 15:

1. **Client utilities**:
   - `createBrowserClient()` for Client Components
   - `createServerClient()` for Server Components/Actions
   - Cookie handling with Next.js cookies()

2. **Middleware** for:
   - Session refresh
   - Protected route redirects
   - Cookie management

3. **Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Files to Create/Modify

- `packages/core/src/auth/supabase-browser.ts` - Browser client
- `packages/core/src/auth/supabase-server.ts` - Server client
- `packages/core/src/auth/middleware.ts` - Auth middleware
- `apps/web/src/middleware.ts` - Next.js middleware
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(auth)/signup/page.tsx` - Signup page

### Patterns to Follow

```typescript
// Server client pattern
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## Dependencies

- **Blocked by**: TASK-0-04 (Supabase local)
- **Blocks**: TASK-1-02 (Organizations), TASK-1-03 (Org creation)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
