import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { forwardRef } from 'react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: forwardRef(function Link(
    { children, href, ...props }: any,
    ref: any
  ) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    )
  }),
}))
