import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard.po';
import { setupApiMocks } from '../fixtures/api-mock';
import { authenticateAsAdmin } from '../fixtures/auth.fixture';

test.describe('E2E: Dashboard & Navigation Flows', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page, request }) => {
    await setupApiMocks(page);
    await authenticateAsAdmin(page, request);
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('TC-DASH-01: Dashboard layout elements render properly', async ({ page }) => {
    await expect(dashboardPage.sidebar).toBeVisible();
    await expect(page.locator('app-default-header')).toBeVisible();
    await expect(page.locator('c-breadcrumb-router')).toBeVisible();
    await expect(dashboardPage.userAvatarDropdown).toBeVisible();
  });

  test('TC-DASH-02: Sidebar navigation switches cleanly to "/users"', async ({ page }) => {
    await dashboardPage.navigateToUsers();
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator('app-users-list')).toBeVisible();

    // Navigate back to dashboard via sidebar
    await page.locator('c-sidebar a[href="/dashboard"]').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
