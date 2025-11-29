# Advanced Routing Patterns

Advanced Next.js App Router patterns for complex UI requirements.

## Parallel Routes

Render multiple pages simultaneously in the same layout.

### Structure

```
app/dashboard/
├── @analytics/
│   ├── page.tsx
│   └── loading.tsx
├── @team/
│   ├── page.tsx
│   └── loading.tsx
├── layout.tsx
└── page.tsx
```

### Implementation

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">{children}</div>
      <aside className="space-y-4">
        {analytics}
        {team}
      </aside>
    </div>
  )
}
```

### Default Fallbacks

Handle unmatched parallel routes:

```tsx
// app/dashboard/@analytics/default.tsx
export default function AnalyticsDefault() {
  return null // Or fallback UI
}
```

### Conditional Rendering

```tsx
// app/dashboard/layout.tsx
export default function Layout({
  children,
  auth,
  dashboard,
}: {
  children: React.ReactNode
  auth: React.ReactNode
  dashboard: React.ReactNode
}) {
  const isLoggedIn = checkAuth()

  return isLoggedIn ? dashboard : auth
}
```

## Intercepting Routes

Display route content in a modal while preserving the underlying page.

### Convention

- `(.)` - Same level
- `(..)` - One level up
- `(..)(..)` - Two levels up
- `(...)` - Root level

### Modal Pattern

```
app/
├── feed/
│   └── page.tsx
├── @modal/
│   └── (.)photo/
│       └── [id]/
│           └── page.tsx
└── photo/
    └── [id]/
        └── page.tsx
```

### Modal Implementation

```tsx
// app/@modal/(.)photo/[id]/page.tsx
import { Modal } from '@/components/modal'
import Photo from '@/app/photo/[id]/page'

export default async function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Modal>
      <Photo params={Promise.resolve({ id })} />
    </Modal>
  )
}
```

```tsx
// components/modal.tsx
'use client'

import { useRouter } from 'next/navigation'

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <button onClick={() => router.back()}>Close</button>
        {children}
      </div>
    </div>
  )
}
```

### Layout for Modal Slot

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  )
}
```

## Route Groups

Organize routes without affecting URL structure.

### Use Cases

**Marketing vs App sections:**
```
app/
├── (marketing)/
│   ├── layout.tsx      # Marketing layout
│   ├── about/page.tsx  # /about
│   └── pricing/page.tsx # /pricing
└── (app)/
    ├── layout.tsx      # App layout with auth
    ├── dashboard/page.tsx # /dashboard
    └── settings/page.tsx  # /settings
```

**Multiple root layouts:**
```
app/
├── (shop)/
│   ├── layout.tsx  # Shop layout
│   └── products/page.tsx
└── (checkout)/
    ├── layout.tsx  # Minimal checkout layout
    └── cart/page.tsx
```

## Dynamic Imports

Lazy load components for better performance.

### Basic Dynamic Import

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <p>Loading...</p>,
})

export default function Page() {
  return <HeavyComponent />
}
```

### Disable SSR

```tsx
const ClientOnlyMap = dynamic(
  () => import('@/components/map'),
  { ssr: false }
)
```

### Named Exports

```tsx
const SpecificComponent = dynamic(
  () => import('@/components/lib').then((mod) => mod.SpecificComponent)
)
```

## Route Handlers

### Streaming Response

```tsx
// app/api/stream/route.ts
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`))
        await new Promise((r) => setTimeout(r, 1000))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

### CORS Configuration

```tsx
// app/api/data/route.ts
export async function GET(request: Request) {
  return Response.json({ data: 'value' }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

### Route Segment Config

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Set revalidation
export const revalidate = 60

// Runtime selection
export const runtime = 'edge' // or 'nodejs'
```

## Error Boundaries

### Nested Error Handling

```tsx
// app/dashboard/error.tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Dashboard Error</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )
}
```

### Global Error

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

## Not Found Handling

### Custom 404

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

### Programmatic Not Found

```tsx
import { notFound } from 'next/navigation'

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return <div>{user.name}</div>
}
```

## Middleware Patterns

### Authentication

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/about']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Geolocation Redirect

```tsx
export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US'

  if (country === 'DE' && !request.nextUrl.pathname.startsWith('/de')) {
    return NextResponse.redirect(new URL('/de', request.url))
  }

  return NextResponse.next()
}
```

### A/B Testing

```tsx
export function middleware(request: NextRequest) {
  const bucket = request.cookies.get('bucket')?.value

  if (!bucket) {
    const newBucket = Math.random() < 0.5 ? 'control' : 'experiment'
    const response = NextResponse.next()
    response.cookies.set('bucket', newBucket)
    return response
  }

  return NextResponse.next()
}
```
