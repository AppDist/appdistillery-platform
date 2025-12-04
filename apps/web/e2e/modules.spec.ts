import { test, expect } from '@playwright/test';
import { ROUTES } from './fixtures/test-data';

/**
 * Module Management E2E Tests
 *
 * Tests module management functionality including:
 * - Viewing module list
 * - Module details display
 * - Module enable/disable toggle (for admins)
 *
 * Note: These tests require authentication and will redirect to login if not authenticated.
 */

test.describe('Module Management', () => {
  test.describe('Module List', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto(ROUTES.modules);

      // Should redirect to login page
      await expect(page).toHaveURL(new RegExp(ROUTES.login));
    });

    test.skip('shows modules page when authenticated', async ({ page }) => {
      // TODO: This test requires authentication setup
      // Skipped until auth fixture is implemented
      await page.goto(ROUTES.modules);

      // Verify page title
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/module management/i);

      // Verify back link to settings
      const backLink = page.getByRole('link', { name: /back to settings/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', ROUTES.settings);
    });

    test.skip('shows module cards with details', async ({ page }) => {
      // TODO: This test requires authentication and a tenant with modules
      await page.goto(ROUTES.modules);

      // Wait for modules to load (or empty state)
      await page.waitForLoadState('networkidle');

      // Check for either module cards or empty state
      const hasModules = await page.locator('[role="heading"]').filter({ hasText: /no modules available/i }).count() === 0;

      if (hasModules) {
        // Verify module card structure
        const firstModule = page.locator('[role="region"]').first();
        await expect(firstModule).toBeVisible();

        // Each module should show: name, status badge, description, version
        await expect(firstModule.locator('h3')).toBeVisible(); // Module name
        await expect(firstModule.locator('[role="status"]')).toBeVisible(); // Status badge (enabled/disabled)
      } else {
        // Verify empty state
        await expect(page.getByText(/no modules available/i)).toBeVisible();
      }
    });

    test.skip('shows enabled/disabled badges correctly', async ({ page }) => {
      // TODO: This test requires authentication and modules to be available
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      // Find all status badges
      const badges = page.locator('[role="status"]');
      const badgeCount = await badges.count();

      if (badgeCount > 0) {
        // Verify each badge shows either "Enabled" or "Disabled"
        for (let i = 0; i < badgeCount; i++) {
          const badgeText = await badges.nth(i).textContent();
          expect(badgeText).toMatch(/^(Enabled|Disabled)$/i);
        }
      }
    });

    test.skip('displays module version information', async ({ page }) => {
      // TODO: This test requires authentication and modules
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      // Check for version text (format: "Version X.X.X")
      const versionText = page.getByText(/version \d+\.\d+\.\d+/i);
      if (await versionText.count() > 0) {
        await expect(versionText.first()).toBeVisible();
      }
    });
  });

  test.describe('Module Toggle', () => {
    test.skip('shows toggle for admin users', async ({ page }) => {
      // TODO: This test requires authentication as admin user
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      // Admin users should see toggle switches
      // Non-admin users should NOT see toggle switches
      // This would need to be tested with different user roles
    });

    test.skip('can toggle module on/off', async ({ page }) => {
      // TODO: This test requires authentication as admin
      // TODO: Verify toggle interaction and status change
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      // Find first toggle (if any)
      const toggle = page.locator('[role="switch"]').first();

      if (await toggle.count() > 0) {
        // Get initial state
        const initialState = await toggle.getAttribute('aria-checked');

        // Click toggle
        await toggle.click();

        // Wait for state change
        await page.waitForTimeout(500);

        // Verify state changed
        const newState = await toggle.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    });

    test.skip('shows loading state during toggle', async ({ page }) => {
      // TODO: This test requires authentication as admin
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      const toggle = page.locator('[role="switch"]').first();

      if (await toggle.count() > 0) {
        // Toggle should show loading/disabled state briefly
        await toggle.click();
        await expect(toggle).toBeDisabled();
      }
    });
  });

  test.describe('Navigation', () => {
    test.skip('can navigate back to settings', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.modules);

      const backLink = page.getByRole('link', { name: /back to settings/i });
      await backLink.click();

      // Should navigate to settings page
      await expect(page).toHaveURL(new RegExp(ROUTES.settings));
    });

    test.skip('link from settings to modules works', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.settings);

      // Find and click "Manage Modules" link
      const manageLink = page.getByRole('link', { name: /manage modules/i });
      await expect(manageLink).toBeVisible();
      await manageLink.click();

      // Should navigate to modules page
      await expect(page).toHaveURL(new RegExp(ROUTES.modules));
    });
  });

  test.describe('Empty State', () => {
    test.skip('shows empty state when no modules available', async ({ page }) => {
      // TODO: This test would require a test database with no modules
      await page.goto(ROUTES.modules);

      await page.waitForLoadState('networkidle');

      // Check for empty state
      const emptyState = page.getByText(/no modules available/i);
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        // Empty state should show an icon
        await expect(page.locator('svg').filter({ has: emptyState })).toBeVisible();
      }
    });
  });

  test.describe('Loading States', () => {
    test.skip('shows skeleton loader while fetching modules', async ({ page }) => {
      // TODO: This test requires authentication
      await page.goto(ROUTES.modules);

      // Check for loading skeleton (appears briefly)
      const skeleton = page.locator('[role="status"][aria-label="Loading modules"]');

      // Skeleton may disappear quickly, so check if it exists or data loaded
      const hasData = await page.locator('h3').count() > 0;
      const hasSkeleton = await skeleton.count() > 0;

      // Either skeleton was shown or data loaded (both valid states)
      expect(hasData || hasSkeleton).toBe(true);
    });
  });
});
