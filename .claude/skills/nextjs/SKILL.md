---
name: nextjs
description: Build and develop Next.js applications using App Router, React Server Components, and modern patterns. Use when creating Next.js projects, implementing routing, data fetching, server/client components, layouts, middleware, or working with Next.js 15+ features. Covers project structure, TypeScript setup, caching strategies, and performance optimization. (project)
---

# Next.js Development

Build modern, full-stack React applications with Next.js 15+ using App Router, Server Components, and best practices.

## Version Information

This skill targets Next.js 15.x (specifically v15.5.6 stable). Compatible with:
- React 19 (stable)
- TypeScript 5+
- Turbopack (stable for development)
- Node.js 18.18+ or 20+

## Quick Start

### Create New Project

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

Interactive prompts will ask about:
- TypeScript: Yes (recommended)
- ESLint: Yes
- Tailwind CSS: Your preference
- `src/` directory: Optional (for larger projects)
- App Router: Yes (required for modern features)
- Import alias: `@/*` (recommended)
- Turbopack: Yes (faster development)

### Basic App Router Structure

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx           # Home page
├── loading.tsx        # Loading UI
├── error.tsx          # Error UI
├── not-found.tsx      # 404 page
└── api/
    └── route.ts       # API endpoints
```

## Core Concepts

### Server Components (Default)

All components in `app/` are Server Components by default. They:
- Run only on the server
- Can fetch data directly (no API routes needed)
- Don't increase JavaScript bundle size
- Cannot use hooks like `useState`, `useEffect`
- Cannot use browser APIs

```tsx
// app/page.tsx - Server Component (default)
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  const posts = await data.json()
  
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Client Components

Add `'use client'` at the top to create Client Components. They:
- Can use React hooks (`useState`, `useEffect`, etc.)
- Can use browser APIs
- Increase JavaScript bundle size
- Are pre-rendered on server, then hydrated on client

```tsx
// app/components/like-button.tsx
'use client'

import { useState } from 'react'

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)
  
  return (
    <button onClick={() => setLikes(likes + 1)}>
      Likes: {likes}
    </button>
  )
}
```

### Composition Pattern

Pass data from Server Components to Client Components:

```tsx
// app/posts/[id]/page.tsx - Server Component
import { LikeButton } from '@/components/like-button'

export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const post = await getPost(id)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* Pass server data to client component */}
      <LikeButton initialLikes={post.likes} />
    </article>
  )
}
```

## File-Based Routing

### Basic Routes

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
└── blog/
    ├── page.tsx          → /blog
    └── [slug]/
        └── page.tsx      → /blog/:slug
```

### Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  
  return <article>{post.content}</article>
}

// Generate static pages at build time
export async function generateStaticParams() {
  const posts = await getPosts()
  
  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

### Catch-All Routes

```
app/docs/[...slug]/page.tsx  → /docs/a, /docs/a/b, /docs/a/b/c
```

### Route Groups

Organize routes without affecting URL structure:

```
app/
├── (marketing)/
│   ├── about/page.tsx    → /about
│   └── contact/page.tsx  → /contact
└── (shop)/
    ├── products/page.tsx → /products
    └── cart/page.tsx     → /cart
```

## Layouts

### Root Layout (Required)

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Nested Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <nav>Dashboard Nav</nav>
      <main>{children}</main>
    </div>
  )
}
```

Layouts:
- Share UI across multiple pages
- Preserve state during navigation
- Don't re-render when navigating between child pages

## Data Fetching

### Server Component Data Fetching

```tsx
// Default: Cached until manually revalidated
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'force-cache' // Default, can be omitted
  })
  return res.json()
}

// Dynamic: Fetch fresh data on every request
async function getDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  return res.json()
}

// Revalidate: Cache with time-based revalidation
async function getRevalidatedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  })
  return res.json()
}
```

### Request Memoization

Multiple identical `fetch` requests in the same render are automatically deduplicated:

```tsx
// Both fetch calls use the same data
async function Component1() {
  const data = await fetch('https://api.example.com/data')
  // ...
}

async function Component2() {
  const data = await fetch('https://api.example.com/data') // Memoized
  // ...
}
```

### Database Queries

```tsx
import { db, posts } from '@/lib/db'

export default async function Page() {
  const allPosts = await db.select().from(posts)
  
  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Accessing Request Data

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('AUTH_TOKEN')?.value
  
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  
  return <div>User Agent: {userAgent}</div>
}
```

## Caching Strategies

Next.js 15 uses **opt-in caching** by default (no automatic caching).

### Force Static Caching

```tsx
// Force route to be static
export const dynamic = 'force-static'

export default function Page() {
  return <div>This page is statically cached</div>
}
```

### Force Dynamic Rendering

```tsx
// Opt out of caching
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>Always fresh data</div>
}
```

### Revalidation Options

```tsx
// Time-based revalidation (seconds)
export const revalidate = 3600 // Revalidate every hour

// Or per-fetch
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }
})
```

### Cache Tags for Manual Revalidation

```tsx
// Tag cached data
fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})

// Revalidate by tag
import { revalidateTag } from 'next/cache'

export async function createPost() {
  // ... create post
  revalidateTag('posts')
}
```

## Loading and Error States

### Loading UI

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

### Error Handling

```tsx
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments />
      </Suspense>
    </div>
  )
}
```

## API Routes

### Basic Route Handler

```tsx
// app/api/posts/route.ts
export async function GET() {
  const posts = await getPosts()
  return Response.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const post = await createPost(body)
  return Response.json(post, { status: 201 })
}
```

### Dynamic Route Handler

```tsx
// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await getPost(id)
  return Response.json(post)
}
```

### Request Context

```tsx
import { cookies, headers } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  const token = cookieStore.get('token')
  const referer = headersList.get('referer')
  
  return Response.json({ token, referer })
}
```

## Middleware

```tsx
// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check authentication
  const token = request.cookies.get('token')
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths use middleware
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

## Metadata and SEO

### Static Metadata

```tsx
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Welcome to my app',
  openGraph: {
    title: 'My App',
    description: 'Welcome to my app',
    images: ['/og-image.jpg'],
  },
}
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  
  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

## TypeScript Configuration

```typescript
// next.config.ts (Next.js 15 supports TypeScript config)
import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    domains: ['example.com'],
  },
  experimental: {
    typedRoutes: true, // Type-safe navigation
  },
}

export default config
```

## Common Workflows

### Authentication Flow
1. Create login API route: `app/api/auth/login/route.ts`
2. Set HTTP-only cookie with session token
3. Use middleware to protect routes
4. Access session in Server Components via `cookies()`

### Form Handling with Server Actions
See [references/server-actions.md](references/server-actions.md)

### Image Optimization
See [references/image-optimization.md](references/image-optimization.md)

### Environment Variables
See [references/environment-variables.md](references/environment-variables.md)

## Performance Best Practices

1. **Use Server Components by default** - Only add `'use client'` when needed
2. **Leverage streaming** - Use Suspense for progressive rendering
3. **Optimize images** - Use `next/image` component
4. **Implement caching** - Choose appropriate caching strategy
5. **Code splitting** - Dynamic imports for large components
6. **Use TypeScript** - Catch errors at build time

## Troubleshooting

### Common Issues

**Hydration Errors**: Check for mismatched HTML between server and client
- Don't use `Date.now()` or `Math.random()` in Server Components
- Ensure consistent HTML structure

**Build Errors**: Clear `.next` folder and rebuild
```bash
rm -rf .next
npm run build
```

**Type Errors**: Ensure `@types/node` and `@types/react` are installed

## References

For detailed information:
- [Server Actions & Forms](references/server-actions.md)
- [Advanced Routing Patterns](references/advanced-patterns.md)
- [Image Optimization](references/image-optimization.md)
- [Environment Variables](references/environment-variables.md)
- [Deployment Guide](references/deployment.md)
- [Testing Strategies](references/testing.md)

