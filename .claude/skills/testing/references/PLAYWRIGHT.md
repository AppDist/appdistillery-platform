# Playwright E2E Testing for AppDistillery

> **Version**: Playwright 1.51+
> **Official Docs**: https://playwright.dev

## Setup for AppDistillery

### Installation

```bash
pnpm add -D @playwright/test
npx playwright install
```

### Configuration

`apps/web/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('user can create a new lead', async ({ page }) => {
  // Navigate
  await page.goto('/agency/leads');

  // Interact
  await page.getByRole('button', { name: /new lead/i }).click();
  await page.getByLabel('Name').fill('Test Client');
  await page.getByLabel('Email').fill('client@example.com');
  await page.getByLabel('Requirements').fill('Build a website');
  await page.getByRole('button', { name: /submit/i }).click();

  // Assert
  await expect(page.getByText('Lead created')).toBeVisible();
  await expect(page).toHaveURL(/\/agency\/leads\/\w+/);
});
```

## User-Facing Locators

```typescript
// ✅ GOOD: User-facing attributes
await page.getByRole('button', { name: 'Submit' });
await page.getByLabel('Email address');
await page.getByText('Welcome back');
await page.getByTestId('lead-card');

// ❌ BAD: Implementation details
await page.locator('.btn-primary');
await page.locator('#email-input');
```

## Authentication Flow Testing

### Test Auth Requirement

```typescript
test('redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/agency/leads');

  await expect(page).toHaveURL('/login');
});
```

### Authenticated Tests

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/agency');

    await use(page);
  },
});

// In tests
import { test } from './fixtures/auth';

test('authenticated user can access leads', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/agency/leads');
  await expect(authenticatedPage.getByText('Leads')).toBeVisible();
});
```

## Testing AI Operations

```typescript
test('user can generate a project scope', async ({ authenticatedPage: page }) => {
  // Create a lead first
  await page.goto('/agency/leads/new');
  await page.getByLabel('Name').fill('Test Client');
  await page.getByLabel('Email').fill('client@example.com');
  await page.getByLabel('Requirements').fill('E-commerce website with payment');
  await page.getByRole('button', { name: /submit/i }).click();

  // Generate scope
  await page.getByRole('button', { name: /generate scope/i }).click();

  // Wait for AI generation (may take time)
  await expect(page.getByText(/generating/i)).toBeVisible();

  // Wait for results (with longer timeout for AI)
  await expect(page.getByText(/deliverables/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/timeline/i)).toBeVisible();
});
```

## Form Testing Patterns

```typescript
test('validates lead form input', async ({ page }) => {
  await page.goto('/agency/leads/new');

  // Submit empty form
  await page.getByRole('button', { name: /submit/i }).click();

  // Check validation errors
  await expect(page.getByText(/name is required/i)).toBeVisible();
  await expect(page.getByText(/email is required/i)).toBeVisible();

  // Fill with invalid email
  await page.getByLabel('Email').fill('invalid');
  await page.getByRole('button', { name: /submit/i }).click();

  await expect(page.getByText(/invalid email/i)).toBeVisible();
});
```

## Network Mocking

```typescript
test('handles API errors gracefully', async ({ page }) => {
  // Mock API to return error
  await page.route('**/api/leads', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  await page.goto('/agency/leads');

  await expect(page.getByText(/failed to load/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
});

test('handles slow responses', async ({ page }) => {
  await page.route('**/api/leads', async route => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await route.continue();
  });

  await page.goto('/agency/leads');

  // Should show loading state
  await expect(page.getByText(/loading/i)).toBeVisible();
});
```

## Testing Multi-Tenant Isolation

```typescript
test('user only sees their organization data', async ({ page }) => {
  // Login as org1 user
  await loginAs(page, 'user1@org1.com');
  await page.goto('/agency/leads');

  // Should see org1 leads
  await expect(page.getByText('Org1 Lead')).toBeVisible();
  await expect(page.getByText('Org2 Lead')).not.toBeVisible();

  // Logout and login as org2 user
  await logout(page);
  await loginAs(page, 'user2@org2.com');
  await page.goto('/agency/leads');

  // Should see org2 leads
  await expect(page.getByText('Org2 Lead')).toBeVisible();
  await expect(page.getByText('Org1 Lead')).not.toBeVisible();
});
```

## Common Patterns

### Wait for Navigation

```typescript
await page.getByRole('link', { name: 'Leads' }).click();
await page.waitForURL('/agency/leads');
await expect(page).toHaveURL(/.*leads/);
```

### File Uploads

```typescript
test('uploads document to lead', async ({ page }) => {
  await page.goto('/agency/leads/123');

  const fileInput = page.getByLabel('Upload document');
  await fileInput.setInputFiles('path/to/document.pdf');

  await page.getByRole('button', { name: 'Upload' }).click();

  await expect(page.getByText('Document uploaded')).toBeVisible();
});
```

### Dropdown Selection

```typescript
await page.getByLabel('Status').selectOption('qualified');
await page.getByRole('combobox', { name: 'Assign to' }).click();
await page.getByRole('option', { name: 'John Doe' }).click();
```

## Debugging

```bash
# UI Mode (best for development)
npx playwright test --ui

# Debug specific test
npx playwright test --debug tests/leads.spec.ts

# Headed mode (see browser)
npx playwright test --headed

# Trace viewer
npx playwright show-trace trace.zip
```

## Running Tests

```bash
# All tests
npx playwright test

# Specific browser
npx playwright test --project=chromium

# Specific file
npx playwright test tests/e2e/leads.spec.ts

# With trace recording
npx playwright test --trace on

# Generate test from recording
npx playwright codegen localhost:3000
```

## Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Best Practices

1. **Use accessible locators**: getByRole, getByLabel, getByText
2. **Leverage auto-waiting**: Don't add manual waits
3. **Isolate tests**: Each test should be independent
4. **Test user flows**: Focus on end-to-end scenarios
5. **Mock external services**: Don't hit real AI APIs in CI
6. **Use fixtures**: Share setup between tests
7. **Set appropriate timeouts**: AI operations need longer timeouts

## Related

- [SKILL.md](../SKILL.md) - Main testing patterns
- [TDD_WORKFLOWS.md](TDD_WORKFLOWS.md) - E2E TDD workflows
- [VITEST.md](VITEST.md) - Unit test configuration
