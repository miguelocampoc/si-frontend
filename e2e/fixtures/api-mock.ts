import { Page } from '@playwright/test';
import { INITIAL_MOCK_USERS, MockUser } from './test-data';

/**
 * Sets up hermetic API route interceptions for deterministic E2E testing.
 * If USE_LIVE_API=true is set in the environment, mocking is skipped to test against real backend.
 */
export async function setupApiMocks(page: Page) {
  if (process.env.USE_LIVE_API === 'true') {
    return;
  }

  // Local state per test
  const users: MockUser[] = JSON.parse(JSON.stringify(INITIAL_MOCK_USERS));
  let nextId = 4;

  // POST /api/v1/login
  await page.route('**/api/v1/login', async (route) => {
    const postData = route.request().postDataJSON();
    if (postData?.email === 'admin@test.com' && postData?.password === 'password123') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'e2e-sanctum-bearer-token',
            token_type: 'Bearer',
            user: {
              id: 1,
              name: 'Admin User',
              email: 'admin@test.com',
            },
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'These credentials do not match our records.',
        }),
      });
    }
  });

  // POST /api/v1/logout
  await page.route('**/api/v1/logout', async (route) => {
    await route.fulfill({ status: 204 });
  });

  // POST /api/v1/forgot-password
  await page.route('**/api/v1/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'We have emailed your password reset link.' }),
    });
  });

  // Users API handler (GET, POST) - handles query parameters like ?page=1
  await page.route(/\/api\/v1\/users(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: users,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: users.length,
          },
          links: {},
        }),
      });
      return;
    }

    if (method === 'POST') {
      const body = route.request().postDataJSON();

      // Check if email already taken
      if (users.some((u) => u.email === body?.email)) {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'The email has already been taken.',
            errors: {
              email: ['The email has already been taken.'],
            },
          }),
        });
        return;
      }

      const newUser: MockUser = {
        id: nextId++,
        name: body.name,
        email: body.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      users.push(newUser);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: newUser }),
      });
      return;
    }

    await route.continue();
  });

  // Single user handler (PUT, DELETE, GET)
  await page.route(/\/api\/v1\/users\/(\d+)/, async (route) => {
    const match = route.request().url().match(/\/api\/v1\/users\/(\d+)/);
    const id = match ? parseInt(match[1], 10) : null;
    const method = route.request().method();

    if (method === 'PUT' && id) {
      const body = route.request().postDataJSON();
      const user = users.find((u) => u.id === id);

      if (user) {
        user.name = body.name ?? user.name;
        user.email = body.email ?? user.email;
        user.updated_at = new Date().toISOString();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: user }),
        });
      } else {
        await route.fulfill({ status: 404 });
      }
      return;
    }

    if (method === 'DELETE' && id) {
      const index = users.findIndex((u) => u.id === id);
      if (index !== -1) {
        users.splice(index, 1);
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({ status: 404 });
      }
      return;
    }

    await route.continue();
  });
}
