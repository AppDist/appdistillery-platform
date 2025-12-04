/**
 * Test data utilities for E2E tests
 *
 * Provides shared test data and helper functions for generating unique test values.
 */

/**
 * Generate a unique email address for testing
 *
 * @example
 * const email = generateTestEmail('signup');
 * // Returns: test-signup-1733320800000@example.com
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `test-${prefix}-${timestamp}@example.com`;
}

/**
 * Generate a unique tenant name for testing
 *
 * @example
 * const name = generateTenantName('acme');
 * // Returns: acme-1733320800000
 */
export function generateTenantName(prefix: string = 'tenant'): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}`;
}

/**
 * Generate a secure test password
 *
 * @example
 * const password = generateTestPassword();
 * // Returns: TestPass123!
 */
export function generateTestPassword(): string {
  return 'TestPass123!';
}

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: 'test-user@example.com',
  password: 'TestPassword123!',
  invalidPassword: 'WrongPass123!',
} as const;

/**
 * Test tenant data
 */
export const TEST_TENANT = {
  name: 'Test Organization',
  slug: 'test-org',
} as const;

/**
 * Test navigation paths
 */
export const ROUTES = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  settings: '/settings',
} as const;

/**
 * Wait for navigation to complete
 *
 * Helper to ensure navigation is fully complete before proceeding.
 */
export async function waitForUrl(
  page: { url: () => string; waitForLoadState: (state: 'load' | 'domcontentloaded' | 'networkidle') => Promise<void> },
  expectedUrl: string,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (page.url().includes(expectedUrl)) {
      await page.waitForLoadState('domcontentloaded');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for URL to include: ${expectedUrl}`);
}
