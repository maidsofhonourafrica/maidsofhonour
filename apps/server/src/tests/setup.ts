import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'maidsofhonour_test';

beforeAll(async () => {
  // Global test setup if needed
});

afterAll(async () => {
  // Global test cleanup if needed
});
