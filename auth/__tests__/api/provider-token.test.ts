import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Provider Token API', () => {
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
  const BASE_URL = 'http://localhost:3002';

  it('should reject requests without API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`
    );
    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`,
      {
        headers: { 'x-api-key': 'invalid' },
      }
    );
    expect(response.status).toBe(401);
  });

  it('should accept requests with valid API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`,
      {
        headers: { 'x-api-key': INTERNAL_API_KEY! },
      }
    );
    expect(response.status).toBeIn([200, 404]); // 404 if no account found
  });
});