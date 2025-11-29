# SSR (Server-Side Rendering) Patterns

Complete guide to implementing Supabase authentication and data fetching in server-side rendered applications.

## Table of Contents

- Overview
- Installation
- Next.js Setup
- SvelteKit Setup
- Astro Setup
- Middleware Configuration
- Client Creation Patterns
- Security Considerations

## Overview

Server-Side Rendering (SSR) with Supabase requires:

1. Cookie-based session storage (not localStorage)
2. PKCE authentication flow for enhanced security
3. Middleware to refresh tokens automatically
4. Different client instances for server vs browser

The `@supabase/ssr` package provides framework-agnostic utilities for SSR.

## Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Next.js Setup

### Directory Structure

```
your-app/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   └── ...
├── middleware.ts
└── utils/
    └── supabase/
        ├── client.ts      # Browser client
        ├── server.ts      # Server component client
        └── middleware.ts  # Middleware client
```

### Browser Client (Client Components)

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Usage in Client Components:

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <div>User: {user?.email}</div>
}
```

### Server Client (Server Components & Route Handlers)

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie setting can fail in Server Components
            // This is expected and handled by middleware
          }
        },
      },
    }
  )
}
```

Usage in Server Components:

```typescript
// app/page.tsx
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch data
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user?.id)

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      {posts?.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

Usage in Route Handlers:

```typescript
// app/api/posts/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(posts)
}
```

### Middleware Client

```typescript
// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // No user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing the cookies!
  // 4. Finally: return myNewResponse
  // If this is not done, you may be causing the browser and server to go out of sync and terminate the user's session prematurely!

  return supabaseResponse
}
```

### Middleware Configuration

```typescript
// middleware.ts
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### OAuth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`)
}
```

### Magic Link Email Confirmation

For PKCE flow with magic links, update email template:

```html
<!-- In Supabase Dashboard > Authentication > Email Templates -->
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Confirm your email
  </a>
</p>
```

Confirmation handler:

```typescript
// app/auth/confirm/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Error handling
  return NextResponse.redirect(new URL('/error', request.url))
}
```

## SvelteKit Setup

### Client Creation

```typescript
// src/lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const createSupabaseClient = () => {
  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
}
```

### Server-Side Hook

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr'
import { type Handle } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' })
          })
        },
      },
    }
  )

  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    return { session }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}
```

### Load Function

```typescript
// src/routes/+layout.server.ts
export const load = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()
  return { session }
}
```

## Astro Setup

### Client Creation

```typescript
// src/lib/supabase.ts
import { createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

export const createClient = (cookies: AstroCookies) => {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options)
          )
        },
      },
    }
  )
}
```

Usage:

```astro
---
// src/pages/index.astro
import { createClient } from '../lib/supabase'

const supabase = createClient(Astro.cookies)
const { data: { user } } = await supabase.auth.getUser()
---

<html>
  <body>
    <h1>Welcome {user?.email}</h1>
  </body>
</html>
```

## Security Considerations

### IMPORTANT: Server-Side Authentication

```typescript
// ❌ WRONG: Never trust getSession() on server
const { data: { session } } = await supabase.auth.getSession()
// Session can be spoofed by the client!

// ✅ CORRECT: Always use getUser() for auth checks
const { data: { user } } = await supabase.auth.getUser()
// Validates JWT with auth server
```

### Protected Routes Pattern

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // User is authenticated, proceed with page
  return <div>Dashboard for {user.email}</div>
}
```

### Row Level Security (RLS)

Always enable RLS on tables:

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own posts
CREATE POLICY "Users can view own posts"
  ON posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Allow users to insert their own posts
CREATE POLICY "Users can insert own posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = author_id);
```

## Common Patterns

### Auth State Management (Client)

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return children
}
```

### Server Action for Sign Out

```typescript
// app/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

### Data Fetching with Error Handling

```typescript
// app/posts/page.tsx
import { createClient } from '@/utils/supabase/server'

export default async function PostsPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading posts: {error.message}</div>
  }

  if (!posts || posts.length === 0) {
    return <div>No posts found</div>
  }

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

## Troubleshooting

**Issue**: "Session expired" or frequent logouts
- Check middleware is properly configured
- Verify `updateSession` is called correctly
- Ensure cookies are properly passed between server/client

**Issue**: "Could not find cookie" errors
- Verify cookie options in `createServerClient`
- Check middleware matcher patterns
- Ensure cookies aren't blocked by browser

**Issue**: Redirect loops
- Check middleware logic for infinite redirects
- Verify protected routes configuration
- Use `getUser()` not `getSession()` for auth checks

**Issue**: User data not updating
- Call `router.refresh()` after auth changes
- Use `revalidatePath()` in server actions
- Check `onAuthStateChange` listener is set up

**Issue**: CORS errors on localhost
- Add `http://localhost:3000` to allowed redirect URLs
- Configure site URL in Supabase dashboard
- Check OAuth provider callback URLs
