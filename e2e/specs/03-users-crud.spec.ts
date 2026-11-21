import { test, expect } from '@playwright/test';
import { UsersPage } from '../page-objects/users.po';
import { setupApiMocks } from '../fixtures/api-mock';
import { authenticateAsAdmin } from '../fixtures/auth.fixture';

test.describe('E2E: Users CRUD Operations & Modals', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page, request }) => {
    await setupApiMocks(page);
    await authenticateAsAdmin(page, request);
    usersPage = new UsersPage(page);
    await usersPage.goto();
  });

  test('TC-USERS-01: Displays users table with headers and rows', async () => {
    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.table.locator('th').filter({ hasText: 'Name' })).toBeVisible();
    await expect(usersPage.table.locator('th').filter({ hasText: 'Email' })).toBeVisible();
    await expect(usersPage.table.locator('th').filter({ hasText: 'Actions' })).toBeVisible();

    const count = await usersPage.userRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-USERS-02: Create User modal validates required fields and password mismatch', async () => {
    await usersPage.openCreateModal();

    // Submit empty form to trigger required validations
    await usersPage.submitForm();
    await expect(usersPage.nameError).toBeVisible();
    await expect(usersPage.emailError).toBeVisible();
    await expect(usersPage.passwordError).toBeVisible();
    await expect(usersPage.confirmationError).toBeVisible();

    // Fill mismatched passwords
    await usersPage.fillForm('Test QA', 'qa@test.com', 'password123', 'differentpassword');
    await usersPage.submitForm();
    await expect(usersPage.confirmationError).toContainText(/passwords do not match/i);

    // Modal should remain open
    await expect(usersPage.formModal).toBeVisible();

    // Cancel closes modal cleanly
    await usersPage.formCancelButton.click();
    await expect(usersPage.formModal).not.toBeVisible();
  });

  test('TC-USERS-03: Full lifecycle - Create, Edit own account, and Delete a User', async () => {
    const timestamp = Date.now();
    const testUserName = `QA User ${timestamp}`;
    const testUserEmail = `qa.${timestamp}@example.com`;

    // 1. CREATE USER
    await usersPage.openCreateModal();
    await usersPage.fillForm(testUserName, testUserEmail, 'password123', 'password123');
    await usersPage.submitForm();

    // Verify modal closes and success notification appears
    await expect(usersPage.formModal).not.toBeVisible();
    await expect(usersPage.successAlert).toBeVisible();
    await expect(usersPage.successAlert).toContainText(/created/i);

    // Verify user is visible in table
    const createdRow = usersPage.userRows.filter({ hasText: testUserEmail });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText(testUserName);

    // 2. DELETE USER
    await usersPage.openDeleteModalForUser(testUserName);
    await expect(usersPage.deleteModal).toBeVisible();
    await expect(usersPage.deleteMessage).toContainText(testUserName);

    // Cancel first
    await usersPage.deleteCancelButton.click();
    await expect(usersPage.deleteModal).not.toBeVisible();
    await expect(createdRow).toBeVisible();

    // Re-open and confirm delete
    await usersPage.openDeleteModalForUser(testUserName);
    await usersPage.confirmDelete();

    await expect(usersPage.deleteModal).not.toBeVisible();
    await expect(usersPage.successAlert).toBeVisible();
    await expect(usersPage.successAlert).toContainText(/deleted/i);

    // Verify user was removed from table
    await expect(usersPage.userRows.filter({ hasText: testUserEmail })).not.toBeVisible();
  });

  test('TC-USERS-04: Edit user loads prefilled values and requires confirmation', async () => {
    // Open edit for Admin User
    await usersPage.openEditModalForUser('Admin User');
    await expect(usersPage.nameInput).toHaveValue('Admin User');
    await expect(usersPage.emailInput).toHaveValue('admin@test.com');
    await expect(usersPage.passwordInput).toHaveValue('');

    // Cancel to preserve data
    await usersPage.formCancelButton.click();
    await expect(usersPage.formModal).not.toBeVisible();
  });

  test('TC-USERS-05: Server 422 duplicate email error maps directly onto form input', async () => {
    await usersPage.openCreateModal();
    // Try creating with an email that is already taken by admin
    await usersPage.fillForm('Duplicate User', 'admin@test.com', 'password123', 'password123');
    await usersPage.submitForm();

    // Form modal stays open and shows server error on email field
    await expect(usersPage.formModal).toBeVisible();
    await expect(usersPage.emailError).toBeVisible();
    await expect(usersPage.emailError).toContainText(/already been taken/i);

    await usersPage.formCancelButton.click();
  });
});
