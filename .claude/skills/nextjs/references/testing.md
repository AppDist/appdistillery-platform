# Testing Strategies

Comprehensive testing approaches for Next.js applications including unit tests, integration tests, and end-to-end tests.

## Testing Setup

### Jest with React Testing Library

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Path to Next.js app
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Unit Testing

### Testing Client Components

```tsx
// components/counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
```

```tsx
// components/counter.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './counter'

describe('Counter', () => {
  it('renders initial count', () => {
    render(<Counter />)
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })
  
  it('increments count on button click', async () => {
    const user = userEvent.setup()
    render(<Counter />)
    
    const button = screen.getByRole('button', { name: /increment/i })
    await user.click(button)
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})
```

### Testing Server Components

```tsx
// components/posts.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export async function Posts() {
  const posts = await getPosts()
  
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

```tsx
// components/posts.test.tsx
import { render, screen } from '@testing-library/react'
import { Posts } from './posts'

// Mock fetch
global.fetch = jest.fn()

describe('Posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders posts list', async () => {
    const mockPosts = [
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' },
    ]
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockPosts,
    })
    
    const component = await Posts()
    render(component)
    
    expect(screen.getByText('Post 1')).toBeInTheDocument()
    expect(screen.getByText('Post 2')).toBeInTheDocument()
  })
})
```

### Testing Hooks

```tsx
// hooks/use-counter.ts
import { useState } from 'react'

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  const reset = () => setCount(initialValue)
  
  return { count, increment, decrement, reset }
}
```

```tsx
// hooks/use-counter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './use-counter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })
  
  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })
  
  it('increments count', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
  
  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(5))
    
    act(() => {
      result.current.increment()
      result.current.reset()
    })
    
    expect(result.current.count).toBe(5)
  })
})
```

## Integration Testing

### Testing Server Actions

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  const post = await db.posts.create({
    data: { title }
  })
  
  revalidatePath('/posts')
  return { success: true, post }
}
```

```tsx
// app/actions.test.ts
import { createPost } from './actions'
import { db } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('createPost', () => {
  it('creates post with valid data', async () => {
    const mockPost = { id: 1, title: 'Test Post' }
    ;(db.posts.create as jest.Mock).mockResolvedValue(mockPost)
    
    const formData = new FormData()
    formData.append('title', 'Test Post')
    
    const result = await createPost(formData)
    
    expect(result.success).toBe(true)
    expect(result.post).toEqual(mockPost)
  })
  
  it('returns error with invalid data', async () => {
    const formData = new FormData()
    
    const result = await createPost(formData)
    
    expect(result.error).toBe('Title is required')
  })
})
```

### Testing API Routes

```tsx
// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const posts = await db.posts.findMany()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const post = await db.posts.create({ data: body })
  return NextResponse.json(post, { status: 201 })
}
```

```tsx
// app/api/posts/route.test.ts
import { GET, POST } from './route'
import { db } from '@/lib/db'

jest.mock('@/lib/db')

describe('/api/posts', () => {
  describe('GET', () => {
    it('returns posts list', async () => {
      const mockPosts = [{ id: 1, title: 'Post 1' }]
      ;(db.posts.findMany as jest.Mock).mockResolvedValue(mockPosts)
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual(mockPosts)
    })
  })
  
  describe('POST', () => {
    it('creates new post', async () => {
      const mockPost = { id: 1, title: 'New Post' }
      ;(db.posts.create as jest.Mock).mockResolvedValue(mockPost)
      
      const request = new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Post' }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toEqual(mockPost)
    })
  })
})
```

## End-to-End Testing

### Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Example

```typescript
// e2e/posts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Posts Page', () => {
  test('displays posts list', async ({ page }) => {
    await page.goto('/posts')
    
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()
    
    const posts = page.getByRole('article')
    await expect(posts).toHaveCount(3)
  })
  
  test('creates new post', async ({ page }) => {
    await page.goto('/posts/new')
    
    await page.fill('input[name="title"]', 'Test Post')
    await page.fill('textarea[name="content"]', 'Test content')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/posts')
    await expect(page.getByText('Test Post')).toBeVisible()
  })
  
  test('navigates to post detail', async ({ page }) => {
    await page.goto('/posts')
    
    await page.click('text=First Post')
    
    await expect(page).toHaveURL(/\/posts\/\d+/)
    await expect(page.getByRole('heading')).toContainText('First Post')
  })
})
```

### Testing Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login flow', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()
  })
  
  test('protects authenticated routes', async ({ page }) => {
    await page.goto('/dashboard')
    
    await expect(page).toHaveURL('/login')
  })
  
  test('logout flow', async ({ page, context }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Logout
    await page.click('button:has-text("Logout")')
    
    await expect(page).toHaveURL('/')
    
    // Verify can't access protected route
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
```

## Visual Regression Testing

### Percy Setup

```bash
npm install --save-dev @percy/cli @percy/playwright
```

```typescript
// e2e/visual.spec.ts
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Visual Tests', () => {
  test('homepage snapshot', async ({ page }) => {
    await page.goto('/')
    await percySnapshot(page, 'Homepage')
  })
  
  test('dark mode snapshot', async ({ page }) => {
    await page.goto('/')
    await page.click('button[aria-label="Toggle dark mode"]')
    await percySnapshot(page, 'Homepage - Dark Mode')
  })
})
```

## Testing Best Practices

### 1. Mock External Dependencies

```typescript
// __mocks__/next/navigation.ts
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}))

export const usePathname = jest.fn(() => '/')
export const useSearchParams = jest.fn(() => new URLSearchParams())
```

### 2. Test Accessibility

```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 3. Use Test IDs Sparingly

```tsx
// Prefer semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)

// Use test IDs only when necessary
screen.getByTestId('complex-component')
```

### 4. Test User Interactions

```tsx
import userEvent from '@testing-library/user-event'

test('form submission', async () => {
  const user = userEvent.setup()
  render(<Form />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

### 5. Test Error States

```tsx
test('displays error message on failure', async () => {
  server.use(
    rest.post('/api/posts', (req, res, ctx) => {
      return res(ctx.status(500))
    })
  )
  
  render(<CreatePost />)
  
  await user.click(screen.getByRole('button', { name: /create/i }))
  
  expect(await screen.findByText(/error/i)).toBeInTheDocument()
})
```

## Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```
