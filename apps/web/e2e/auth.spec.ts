import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  ROUTES,
} from './fixtures/test-data';

/**
 * Auth Flow E2E Tests
 *
 * Tests authentication flows including signup, login, logout, and password reset.
 * These tests verify the complete user authentication journey.
 */

test.describe('Auth Flow', () => {
  test.describe('Login Page', () => {
    test('shows login page for unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Verify page elements
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/sign in/i);
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows validation error for empty email', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Leave email empty and submit
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify error message (use id selector to avoid Next.js route announcer)
      await expect(page.locator('#error-message')).toContainText(/email is required/i);
    });

    test('shows validation error for invalid email format', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify error message
      await expect(page.locator('#error-message')).toContainText(/valid email/i);
    });

    test('shows validation error for empty password', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Enter email but leave password empty
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify error message (use id selector to avoid Next.js route announcer)
      await expect(page.locator('#error-message')).toContainText(/password is required/i);
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Enter non-existent credentials
      await page.getByLabel(/email/i).fill('nonexistent@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify error message appears (use id selector to avoid Next.js route announcer)
      await expect(page.locator('#error-message')).toBeVisible();
    });

    test('has link to signup page', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Verify signup link exists
      const signupLink = page.getByRole('link', { name: /sign up/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', ROUTES.signup);
    });

    test('has link to forgot password page', async ({ page }) => {
      await page.goto(ROUTES.login);

      // Verify forgot password link exists
      const forgotLink = page.getByRole('link', { name: /forgot.*password/i });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', ROUTES.forgotPassword);
    });
  });

  test.describe('Signup Page', () => {
    test('shows signup form', async ({ page }) => {
      await page.goto(ROUTES.signup);

      // Verify page elements
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/create an account/i);
      await expect(page.getByLabel(/^email$/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('shows validation error for invalid email', async ({ page }) => {
      await page.goto(ROUTES.signup);

      // Enter invalid email
      await page.getByLabel(/^email$/i).fill('invalid-email');
      await page.getByLabel(/^password$/i).fill('TestPassword123!');
      await page.getByLabel(/confirm password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /create account/i }).click();

      // Verify error message
      await expect(page.locator('#error-message')).toContainText(/valid email/i);
    });

    test('shows validation error for weak password', async ({ page }) => {
      await page.goto(ROUTES.signup);

      const email = generateTestEmail('weak-password');

      // Enter weak password
      await page.getByLabel(/^email$/i).fill(email);
      await page.getByLabel(/^password$/i).fill('weak');
      await page.getByLabel(/confirm password/i).fill('weak');
      await page.getByRole('button', { name: /create account/i }).click();

      // Verify error message about password requirements (use id selector)
      await expect(page.locator('#error-message')).toBeVisible();
    });

    test('shows validation error for password mismatch', async ({ page }) => {
      await page.goto(ROUTES.signup);

      const email = generateTestEmail('mismatch');
      const password = generateTestPassword();

      // Enter mismatched passwords
      await page.getByLabel(/^email$/i).fill(email);
      await page.getByLabel(/^password$/i).fill(password);
      await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
      await page.getByRole('button', { name: /create account/i }).click();

      // Verify error message (use id selector to avoid Next.js route announcer)
      await expect(page.locator('#error-message')).toContainText(/passwords do not match/i);
    });

    test('shows success message after valid signup', async ({ page }) => {
      await page.goto(ROUTES.signup);

      const email = generateTestEmail('signup');
      const password = generateTestPassword();

      // Fill form with valid data
      await page.getByLabel(/^email$/i).fill(email);
      await page.getByLabel(/^password$/i).fill(password);
      await page.getByLabel(/confirm password/i).fill(password);
      await page.getByRole('button', { name: /create account/i }).click();

      // Verify success message
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/check your email/i);
      await expect(page.getByText(email)).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
      await page.goto(ROUTES.signup);

      // Verify login link exists
      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', ROUTES.login);
    });
  });

  test.describe('Forgot Password', () => {
    test('shows forgot password form', async ({ page }) => {
      await page.goto(ROUTES.forgotPassword);

      // Verify page elements
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/forgot password/i);
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('shows validation error for invalid email', async ({ page }) => {
      await page.goto(ROUTES.forgotPassword);

      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Verify error message
      await expect(page.locator('#error-message')).toContainText(/valid email/i);
    });

    test('shows success message after submitting valid email', async ({ page }) => {
      await page.goto(ROUTES.forgotPassword);

      const email = generateTestEmail('forgot-password');

      // Enter valid email
      await page.getByLabel(/email/i).fill(email);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Verify success message
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/check your email/i);
      await expect(page.getByText(email)).toBeVisible();
    });

    test('has link back to login page', async ({ page }) => {
      await page.goto(ROUTES.forgotPassword);

      // Verify back to login link exists
      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', ROUTES.login);
    });
  });

  test.describe('Auth Navigation', () => {
    test('redirects to login from protected routes when not authenticated', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto(ROUTES.dashboard);

      // Should redirect to login page
      await expect(page).toHaveURL(new RegExp(ROUTES.login));
    });

    test('login button shows loading state', async ({ page }) => {
      await page.goto(ROUTES.login);

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123!');

      // Click submit and check loading state
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });

    test('signup button shows loading state', async ({ page }) => {
      await page.goto(ROUTES.signup);

      const email = generateTestEmail('loading-test');
      const password = generateTestPassword();

      await page.getByLabel(/^email$/i).fill(email);
      await page.getByLabel(/^password$/i).fill(password);
      await page.getByLabel(/confirm password/i).fill(password);

      // Click submit and check loading state
      const submitButton = page.getByRole('button', { name: /create account/i });
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });
});
