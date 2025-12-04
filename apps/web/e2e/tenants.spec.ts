import { test, expect } from '@playwright/test';
import { ROUTES, generateTenantName } from './fixtures/test-data';

/**
 * Tenant Management E2E Tests
 *
 * Tests tenant operations including:
 * - Tenant switcher display and functionality
 * - Creating new tenants (household/organization)
 * - Switching between tenants and personal mode
 * - Tenant settings navigation
 *
 * Note: These tests require authentication and will redirect to login if not authenticated.
 */

test.describe('Tenant Management', () => {
  test.describe('Tenant Switcher', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Should redirect to login page
      await expect(page).toHaveURL(new RegExp(ROUTES.login));
    });

    test.skip('shows tenant switcher when authenticated', async ({ page }) => {
      // TODO: This test requires authentication setup
      // Skipped until auth fixture is implemented
      await page.goto(ROUTES.dashboard);

      // Find tenant switcher button (shows current context)
      const switcher = page.getByRole('button', { name: /current context/i });
      await expect(switcher).toBeVisible();

      // Should show context name (Personal, or tenant name)
      await expect(switcher).toContainText(/(personal|[a-zA-Z0-9\s]+)/i);
    });

    test.skip('opens dropdown menu when clicked', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      // Click tenant switcher
      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Verify dropdown menu appears
      await expect(page.getByRole('menu')).toBeVisible();

      // Should show "Personal Account" section
      await expect(page.getByText(/personal account/i)).toBeVisible();
    });

    test.skip('shows personal mode option', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Find personal mode option
      const personalOption = page.getByRole('menuitem').filter({ hasText: /personal/i });
      await expect(personalOption).toBeVisible();

      // Should show user email
      await expect(personalOption).toContainText(/@/); // Contains @ for email
    });

    test.skip('shows list of tenants when available', async ({ page }) => {
      // TODO: This test requires authentication with user who belongs to tenants
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Check for "Tenants" section
      const tenantsSection = page.getByText(/^tenants$/i).first();
      if (await tenantsSection.count() > 0) {
        await expect(tenantsSection).toBeVisible();

        // Should show tenant items with name and role
        const tenantItems = page.getByRole('menuitem').filter({ has: page.locator('[role="status"]') });
        expect(await tenantItems.count()).toBeGreaterThan(0);
      }
    });

    test.skip('displays tenant type badges', async ({ page }) => {
      // TODO: This test requires authentication with tenants
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Find tenant type badges (household/organization)
      const badges = page.locator('[role="status"]').filter({ hasText: /(household|organization)/i });
      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();
      }
    });

    test.skip('shows active tenant with checkmark', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Active context should have a checkmark icon
      const activeMarker = page.locator('[aria-label="Currently active"]');
      await expect(activeMarker).toBeVisible();
    });

    test.skip('can switch to personal mode', async ({ page }) => {
      // TODO: This test requires authentication in tenant context
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Click personal mode
      const personalOption = page.getByRole('menuitem').filter({ hasText: /^personal$/i }).first();
      await personalOption.click();

      // Wait for page refresh
      await page.waitForLoadState('networkidle');

      // Switcher should now show "Personal"
      await expect(switcher).toContainText(/personal/i);
    });

    test.skip('can switch between tenants', async ({ page }) => {
      // TODO: This test requires authentication with multiple tenants
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Get all tenant menu items
      const tenantItems = page.getByRole('menuitem').filter({ has: page.locator('[role="status"]') });
      const tenantCount = await tenantItems.count();

      if (tenantCount > 1) {
        // Click second tenant
        await tenantItems.nth(1).click();

        // Wait for page refresh
        await page.waitForLoadState('networkidle');

        // Context should change
        await expect(switcher).not.toContainText(/switching/i);
      }
    });

    test.skip('shows loading state during switch', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      const personalOption = page.getByRole('menuitem').filter({ hasText: /^personal$/i }).first();
      await personalOption.click();

      // Should show "Switching..." briefly
      // Note: This may be too fast to catch reliably
      const switchingText = page.getByText(/switching/i);
      // Just verify switcher exists during transition
      await expect(switcher).toBeVisible();
    });
  });

  test.describe('Create New Tenant', () => {
    test.skip('shows create options in switcher menu', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      // Should show "Create New" section
      await expect(page.getByText(/create new/i)).toBeVisible();

      // Should show both household and organization options
      await expect(page.getByRole('menuitem', { name: /create household/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /create organization/i })).toBeVisible();
    });

    test.skip('can navigate to create household page', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      const createHousehold = page.getByRole('menuitem', { name: /create household/i });
      await createHousehold.click();

      // Should navigate to create tenant page with type=household
      await expect(page).toHaveURL(new RegExp(`${ROUTES.tenantsNew}.*type=household`));
    });

    test.skip('can navigate to create organization page', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });
      await switcher.click();

      const createOrg = page.getByRole('menuitem', { name: /create organization/i });
      await createOrg.click();

      // Should navigate to create tenant page with type=organization
      await expect(page).toHaveURL(new RegExp(`${ROUTES.tenantsNew}.*type=organization`));
    });

    test.skip('shows create tenant form', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(`${ROUTES.tenantsNew}?type=organization`);

      // Verify form elements
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create/i })).toBeVisible();
    });

    test.skip('can create new organization tenant', async ({ page }) => {
      // TODO: This test requires authentication
      const tenantName = generateTenantName('test-org');

      await page.goto(`${ROUTES.tenantsNew}?type=organization`);

      // Fill in tenant name
      await page.getByLabel(/name/i).fill(tenantName);

      // Submit form
      await page.getByRole('button', { name: /create/i }).click();

      // Wait for creation and redirect
      await page.waitForLoadState('networkidle');

      // Should redirect to dashboard
      await expect(page).toHaveURL(new RegExp(ROUTES.dashboard));

      // Verify tenant switcher shows new tenant
      const switcher = page.getByRole('button', { name: /current context/i });
      await expect(switcher).toContainText(tenantName);
    });

    test.skip('validates required fields', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(`${ROUTES.tenantsNew}?type=organization`);

      // Try to submit without filling name
      await page.getByRole('button', { name: /create/i }).click();

      // Should show validation error
      await expect(page.locator('#error-message')).toBeVisible();
    });

    test.skip('shows loading state during creation', async ({ page }) => {
      // TODO: This test requires authentication
      const tenantName = generateTenantName('test-org');

      await page.goto(`${ROUTES.tenantsNew}?type=organization`);

      await page.getByLabel(/name/i).fill(tenantName);

      const submitButton = page.getByRole('button', { name: /create/i });
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Tenant Context Display', () => {
    test.skip('shows current tenant in dashboard', async ({ page }) => {
      // TODO: This test requires authentication in tenant context
      await page.goto(ROUTES.dashboard);

      // Dashboard should show current context card
      const contextCard = page.locator('text=Current Context').locator('..');
      await expect(contextCard).toBeVisible();

      // Should show tenant name or "Personal"
      await expect(contextCard).toContainText(/(personal|[a-zA-Z0-9\s]+)/i);
    });

    test.skip('shows user role in tenant context', async ({ page }) => {
      // TODO: This test requires authentication in tenant context
      await page.goto(ROUTES.dashboard);

      const contextCard = page.locator('text=Current Context').locator('..');

      // If in tenant context, should show role
      const roleText = contextCard.locator('text=/Role:/i');
      if (await roleText.count() > 0) {
        await expect(roleText).toContainText(/(owner|admin|member)/i);
      }
    });
  });

  test.describe('Tenant Icons', () => {
    test.skip('shows correct icon for context type', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.dashboard);

      const switcher = page.getByRole('button', { name: /current context/i });

      // Personal mode: User icon
      // Household: Home icon
      // Organization: Building icon
      // Verify icon exists (visual representation)
      const icon = switcher.locator('svg').first();
      await expect(icon).toBeVisible();
    });
  });
});
