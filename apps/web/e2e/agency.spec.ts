import { test, expect } from '@playwright/test';
import { ROUTES, generateTestEmail } from './fixtures/test-data';

/**
 * Agency Module E2E Tests
 *
 * Tests the Agency module flows including:
 * - Dashboard and navigation
 * - Lead creation and viewing
 * - Brief generation
 * - Proposal creation
 *
 * Note: Agency module must be enabled for the tenant.
 * These tests will skip if:
 * - User is not authenticated
 * - No tenant context (personal mode)
 * - Agency module is not installed/enabled
 */

test.describe('Agency Module', () => {
  test.describe('Module Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto(ROUTES.agency);

      // Should redirect to login page
      await expect(page).toHaveURL(new RegExp(ROUTES.login));
    });

    test.skip('shows 404 when module not enabled', async ({ page }) => {
      // TODO: This test requires authentication in context without agency module
      // When module is not enabled, routes should not be accessible
      await page.goto(ROUTES.agency);

      // Should show 404 or "Module not found" error
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
    });
  });

  test.describe('Agency Dashboard', () => {
    test.skip('shows agency dashboard when module enabled', async ({ page }) => {
      // TODO: This test requires authentication with agency module enabled
      // Skipped until auth fixture and module setup is implemented
      await page.goto(ROUTES.agency);

      // Verify page loaded successfully
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/pipeline|agency/i);

      // Should not show error or 404
      await expect(page.locator('text=/404|not found/i')).not.toBeVisible();
    });

    test.skip('shows navigation to different agency sections', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agency);

      // Should have navigation to:
      // - Pipeline (main dashboard)
      // - New Lead (intake)
      // - Briefs
      // - Proposals
      const navLinks = [
        /pipeline|agency/i,
        /new lead|intake/i,
        /briefs/i,
        /proposals/i,
      ];

      for (const pattern of navLinks) {
        await expect(page.getByRole('link', { name: pattern })).toBeVisible();
      }
    });

    test.skip('shows empty state when no leads exist', async ({ page }) => {
      // TODO: This test requires authentication with clean agency state
      await page.goto(ROUTES.agency);

      await page.waitForLoadState('networkidle');

      // Check for empty state message
      const emptyState = page.getByText(/no leads|get started|create.*lead/i);
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    });

    test.skip('shows list of leads when available', async ({ page }) => {
      // TODO: This test requires authentication with existing leads
      await page.goto(ROUTES.agency);

      await page.waitForLoadState('networkidle');

      // Check if leads are displayed (as cards or table rows)
      const leads = page.locator('[data-testid="lead-item"]');
      if (await leads.count() > 0) {
        // Verify lead display includes: name, email, status
        const firstLead = leads.first();
        await expect(firstLead).toBeVisible();

        // Should show lead details
        await expect(firstLead.locator('text=/@/i')).toBeVisible(); // Email
      }
    });
  });

  test.describe('Lead Creation', () => {
    test.skip('can navigate to lead intake form', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agency);

      // Click "New Lead" or "Intake" link
      const intakeLink = page.getByRole('link', { name: /new lead|intake/i });
      await intakeLink.click();

      // Should navigate to intake form
      await expect(page).toHaveURL(new RegExp(ROUTES.agencyIntake));
    });

    test.skip('shows lead intake form', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agencyIntake);

      // Verify form elements
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/new lead|intake/i);
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/requirements|description/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /submit|create/i })).toBeVisible();
    });

    test.skip('can create a new lead', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      const testEmail = generateTestEmail('agency-lead');

      await page.goto(ROUTES.agencyIntake);

      // Fill in lead information
      await page.getByLabel(/name/i).fill('Test Client');
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/requirements|description/i).fill('Need a website for my business');

      // Submit form
      await page.getByRole('button', { name: /submit|create/i }).click();

      // Wait for creation
      await page.waitForLoadState('networkidle');

      // Should redirect to lead details or agency dashboard
      await expect(page).toHaveURL(new RegExp(`(${ROUTES.agency}|/lead/)`));

      // Success message or lead visible
      const successIndicator = page.locator(`text=/${testEmail}|success|created/i`);
      if (await successIndicator.count() > 0) {
        await expect(successIndicator.first()).toBeVisible();
      }
    });

    test.skip('validates required fields in lead form', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agencyIntake);

      // Try to submit without filling fields
      await page.getByRole('button', { name: /submit|create/i }).click();

      // Should show validation errors
      await expect(page.locator('#error-message, [role="alert"]')).toBeVisible();
    });

    test.skip('validates email format', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agencyIntake);

      await page.getByLabel(/name/i).fill('Test Client');
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/requirements|description/i).fill('Test requirements');

      await page.getByRole('button', { name: /submit|create/i }).click();

      // Should show email validation error
      await expect(page.locator('text=/invalid.*email|valid.*email/i')).toBeVisible();
    });

    test.skip('shows loading state during lead creation', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      const testEmail = generateTestEmail('agency-lead');

      await page.goto(ROUTES.agencyIntake);

      await page.getByLabel(/name/i).fill('Test Client');
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/requirements|description/i).fill('Need a website');

      const submitButton = page.getByRole('button', { name: /submit|create/i });
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Lead Details', () => {
    test.skip('can view lead details', async ({ page }) => {
      // TODO: This test requires authentication with existing lead
      await page.goto(ROUTES.agency);

      await page.waitForLoadState('networkidle');

      // Click on first lead (if any)
      const firstLead = page.locator('[data-testid="lead-item"]').first();
      if (await firstLead.count() > 0) {
        await firstLead.click();

        // Should navigate to lead details page
        await expect(page).toHaveURL(/\/lead\/[a-zA-Z0-9-]+/);

        // Should show lead information
        await expect(page.getByText(/@/)).toBeVisible(); // Email
      }
    });

    test.skip('shows lead status and metadata', async ({ page }) => {
      // TODO: This test requires authentication with existing lead
      // Navigate to a lead details page
      // Verify status, created date, and other metadata are displayed
    });

    test.skip('can generate brief from lead', async ({ page }) => {
      // TODO: This test requires authentication with existing lead
      // From lead details, should be able to trigger brief generation
      // This may involve AI processing, so timeout may need adjustment
    });
  });

  test.describe('Briefs', () => {
    test.skip('can navigate to briefs list', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agency);

      const briefsLink = page.getByRole('link', { name: /briefs/i });
      await briefsLink.click();

      await expect(page).toHaveURL(new RegExp(ROUTES.agencyBriefs));
    });

    test.skip('shows empty state when no briefs', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agencyBriefs);

      await page.waitForLoadState('networkidle');

      const emptyState = page.getByText(/no briefs|get started/i);
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    });

    test.skip('lists generated briefs', async ({ page }) => {
      // TODO: This test requires authentication with existing briefs
      await page.goto(ROUTES.agencyBriefs);

      await page.waitForLoadState('networkidle');

      // Check for brief items
      const briefs = page.locator('[data-testid="brief-item"]');
      if (await briefs.count() > 0) {
        await expect(briefs.first()).toBeVisible();
      }
    });

    test.skip('can view brief details', async ({ page }) => {
      // TODO: This test requires authentication with existing brief
      await page.goto(ROUTES.agencyBriefs);

      const firstBrief = page.locator('[data-testid="brief-item"]').first();
      if (await firstBrief.count() > 0) {
        await firstBrief.click();

        // Should show brief content: deliverables, timeline, assumptions
        await expect(page.getByText(/deliverables|timeline|assumptions/i)).toBeVisible();
      }
    });
  });

  test.describe('Proposals', () => {
    test.skip('can navigate to proposals list', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agency);

      const proposalsLink = page.getByRole('link', { name: /proposals/i });
      await proposalsLink.click();

      await expect(page).toHaveURL(new RegExp(ROUTES.agencyProposals));
    });

    test.skip('shows empty state when no proposals', async ({ page }) => {
      // TODO: This test requires authentication with agency module
      await page.goto(ROUTES.agencyProposals);

      await page.waitForLoadState('networkidle');

      const emptyState = page.getByText(/no proposals|get started/i);
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    });

    test.skip('lists generated proposals', async ({ page }) => {
      // TODO: This test requires authentication with existing proposals
      await page.goto(ROUTES.agencyProposals);

      await page.waitForLoadState('networkidle');

      const proposals = page.locator('[data-testid="proposal-item"]');
      if (await proposals.count() > 0) {
        await expect(proposals.first()).toBeVisible();
      }
    });

    test.skip('can generate proposal from brief', async ({ page }) => {
      // TODO: This test requires authentication with existing brief
      // Navigate to brief details
      // Click "Generate Proposal" button
      // Wait for AI generation (may take time)
      // Verify proposal is created
    });
  });

  test.describe('Module Integration', () => {
    test.skip('agency routes appear in navigation when module enabled', async ({ page }) => {
      // TODO: This test requires authentication with agency module enabled
      await page.goto(ROUTES.dashboard);

      // Main nav or sidebar should show agency links
      const agencyNav = page.getByRole('navigation').locator('text=/agency|pipeline/i');
      if (await agencyNav.count() > 0) {
        await expect(agencyNav.first()).toBeVisible();
      }
    });

    test.skip('agency routes hidden when module disabled', async ({ page }) => {
      // TODO: This test requires authentication with agency module disabled
      await page.goto(ROUTES.dashboard);

      // Agency links should not appear in navigation
      const agencyNav = page.getByRole('navigation').locator('text=/agency|pipeline/i');
      expect(await agencyNav.count()).toBe(0);
    });
  });

  test.describe('AI Generation Flows', () => {
    test.skip('shows AI generation loading state', async ({ page }) => {
      // TODO: This test requires authentication and triggering AI generation
      // When generating brief or proposal, should show loading indicator
      // May need to mock or handle long generation times
    });

    test.skip('handles AI generation errors gracefully', async ({ page }) => {
      // TODO: This test requires authentication and simulating AI error
      // Should show error message if AI generation fails
      // User should be able to retry
    });

    test.skip('displays token usage after AI generation', async ({ page }) => {
      // TODO: This test requires authentication and completed AI generation
      // Should show token count or brain units used
    });
  });
});
