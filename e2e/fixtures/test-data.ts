export interface MockUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const TEST_CREDENTIALS = {
  valid: {
    email: 'admin@test.com',
    password: 'password123',
  },
  invalid: {
    email: 'wrong@test.com',
    password: 'badpassword',
  },
};

export const INITIAL_MOCK_USERS: MockUser[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    created_at: '2026-11-14T18:44:05+00:00',
    updated_at: '2026-11-14T18:44:05+00:00',
  },
  {
    id: 2,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    created_at: '2026-11-14T19:00:00+00:00',
    updated_at: '2026-11-14T19:00:00+00:00',
  },
  {
    id: 3,
    name: 'Grace Hopper',
    email: 'grace@example.com',
    created_at: '2026-11-14T19:05:00+00:00',
    updated_at: '2026-11-14T19:05:00+00:00',
  },
];
