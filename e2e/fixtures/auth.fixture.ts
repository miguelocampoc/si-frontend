import { Page, APIRequestContext } from '@playwright/test';

let cachedLiveToken: string | null = null;
let cachedLiveUser: any = null;

/**
 * Fast & reliable authentication helper.
 * If USE_LIVE_API=true, fetches a Sanctum token once via direct API and reuses it across specs,
 * completely avoiding Laravel's throttle:login rate limiter while testing against the real database.
 */
export async function authenticateAsAdmin(page: Page, request: APIRequestContext) {
  let token = 'e2e-sanctum-bearer-token';
  let user = { id: 3, name: 'Admin User', email: 'admin@test.com' };

  if (process.env.USE_LIVE_API === 'true') {
    if (!cachedLiveToken) {
      const res = await request.post('http://127.0.0.1:8000/api/v1/login', {
        data: {
          email: 'admin@test.com',
          password: 'password123',
        },
      });
      if (res.ok()) {
        const body = await res.json();
        cachedLiveToken = body.data?.token ?? body.token;
        cachedLiveUser = body.data?.user ?? body.user;
      }
    }
    if (cachedLiveToken) {
      token = cachedLiveToken;
      user = cachedLiveUser;
    }
  }

  await page.addInitScript(
    ({ t, u }) => {
      localStorage.setItem('auth_token', t);
      localStorage.setItem('auth_user', JSON.stringify(u));
    },
    { t: token, u: user }
  );
}
