import { Locator, Page, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly usersNavLink: Locator;
  readonly userAvatarDropdown: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('c-sidebar');
    this.usersNavLink = page.locator('a[href="/users"]');
    this.userAvatarDropdown = page.locator('button[aria-label="Open user menu"]');
    this.logoutButton = page.locator('[data-test="logout"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.sidebar).toBeVisible();
  }

  async navigateToUsers() {
    await this.usersNavLink.click();
    await expect(this.page).toHaveURL(/\/users/);
  }

  async logout() {
    await this.userAvatarDropdown.click();
    await expect(this.logoutButton).toBeVisible();
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/\/$/);
  }
}
