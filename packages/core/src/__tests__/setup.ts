/**
 * Vitest test setup for @appdistillery/core
 * This file is automatically loaded before each test file
 */

import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key')

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
