import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.po';
import { DashboardPage } from '../page-objects/dashboard.po';
import { TEST_CREDENTIALS } from '../fixtures/test-data';
import { setupApiMocks } from '../fixtures/api-mock';

test.describe('E2E: Authentication & Security Flows', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await setupApiMocks(page);

    // Clear localStorage to guarantee guest state
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('TC-AUTH-01: Unauthenticated users are redirected from protected routes to "/"', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.emailInput).toBeVisible();

    await page.goto('/users');
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-AUTH-02: Client-side validation triggers on empty or invalid input', async () => {
    await loginPage.goto();
    await loginPage.submit();

    await expect(loginPage.emailError).toContainText(/required/i);
    await expect(loginPage.passwordError).toContainText(/required/i);

    await loginPage.fillEmail('not-an-email');
    await loginPage.submit();
    await expect(loginPage.emailError).toContainText(/valid email/i);
  });

  test('TC-AUTH-03: Toggle password visibility switches input type', async () => {
    await loginPage.goto();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-AUTH-04: Failed login displays alert and keeps user on "/"', async () => {
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.invalid.email, TEST_CREDENTIALS.invalid.password);

    // Backend returns 422 (field error) or 401 (general alert)
    await expect(loginPage.emailError.or(loginPage.alertError)).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/$/);
  });

  test('TC-AUTH-05: Successful login redirects to "/dashboard" and sets session', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);

    await loginPage.expectLoggedIn();

    // Verify token was persisted in localStorage
    const storedToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(storedToken).toBeTruthy();
  });

  test('TC-AUTH-06: Authenticated users visiting "/" are redirected to "/dashboard" (guestGuard)', async ({ page }) => {
    // Pre-seed an authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-valid-token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Admin', email: 'admin@test.com' }));
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-AUTH-07: Forgot Password navigation links to "/forgot-password" and back to "/"', async ({ page }) => {
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator('h2')).toContainText(/forgot your password/i);

    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-AUTH-08: User can log out via header dropdown and is redirected to "/"', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);
    await loginPage.expectLoggedIn();

    // Perform logout
    await dashboardPage.logout();

    // Check localStorage was cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});
