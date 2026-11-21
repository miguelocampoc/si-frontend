import { Locator, Page, expect } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly newUserButton: Locator;
  readonly table: Locator;
  readonly userRows: Locator;
  readonly successAlert: Locator;
  readonly errorAlert: Locator;
  readonly emptyAlert: Locator;

  // Form Modal
  readonly formModal: Locator;
  readonly formModalTitle: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly saveButton: Locator;
  readonly formCancelButton: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmationError: Locator;
  readonly formGeneralError: Locator;

  // Delete Modal
  readonly deleteModal: Locator;
  readonly deleteMessage: Locator;
  readonly deleteError: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newUserButton = page.locator('[data-test="new-user"]');
    this.table = page.locator('table');
    this.userRows = page.locator('[data-test="user-row"]');
    this.successAlert = page.locator('[data-test="success"]');
    this.errorAlert = page.locator('[data-test="load-error"]');
    this.emptyAlert = page.locator('[data-test="empty"]');

    // Form Modal
    this.formModal = page.locator('#user-form-modal');
    this.formModalTitle = page.locator('[data-test="modal-title"]');
    this.nameInput = page.locator('#user-name');
    this.emailInput = page.locator('#user-email');
    this.passwordInput = page.locator('#user-password');
    this.passwordConfirmationInput = page.locator('#user-password-confirmation');
    this.saveButton = page.locator('[data-test="save"]');
    this.formCancelButton = page.locator('#user-form-modal [data-test="cancel"]');
    this.nameError = page.locator('[data-test="name-error"]');
    this.emailError = page.locator('[data-test="email-error"]');
    this.passwordError = page.locator('[data-test="password-error"]');
    this.confirmationError = page.locator('[data-test="confirmation-error"]');
    this.formGeneralError = page.locator('[data-test="general-error"]');

    // Delete Modal
    this.deleteModal = page.locator('#user-delete-modal');
    this.deleteMessage = page.locator('[data-test="delete-message"]');
    this.deleteError = page.locator('[data-test="delete-error"]');
    this.deleteConfirmButton = page.locator('[data-test="confirm"]');
    this.deleteCancelButton = page.locator('#user-delete-modal [data-test="cancel"]');
  }

  async goto() {
    await this.page.goto('/users');
    await expect(this.newUserButton).toBeVisible();
  }

  async openCreateModal() {
    await this.newUserButton.click();
    await expect(this.formModal).toBeVisible();
    await expect(this.formModalTitle).toHaveText('New user');
  }

  async fillForm(name: string, email: string, password?: string, confirmPassword?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (password !== undefined) {
      await this.passwordInput.fill(password);
    }
    if (confirmPassword !== undefined) {
      await this.passwordConfirmationInput.fill(confirmPassword);
    }
  }

  async submitForm() {
    await this.saveButton.click();
  }

  async openEditModalForUser(name: string) {
    const row = this.userRows.filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.locator('[data-test="edit"]').click();
    await expect(this.formModal).toBeVisible();
    await expect(this.formModalTitle).toHaveText('Edit user');
  }

  async openDeleteModalForUser(name: string) {
    const row = this.userRows.filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.locator('[data-test="delete"]').click();
    await expect(this.deleteModal).toBeVisible();
    await expect(this.deleteMessage).toContainText(name);
  }

  async confirmDelete() {
    await this.deleteConfirmButton.click();
  }
}
