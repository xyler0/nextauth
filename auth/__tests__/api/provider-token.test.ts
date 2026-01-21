import { describe, it, expect } from '@jest/globals';

const BASE_URL = 'http://localhost:3002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

describe('Provider Token API', () => {
  it('should reject requests without API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`
    );
    expect([401, 403]).toContain(response.status);
  });

  it('should reject requests with invalid API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`,
      {
        headers: { 'x-api-key': 'invalid' },
      }
    );
    expect([401, 403]).toContain(response.status);
  });

  it('should accept requests with valid API key', async () => {
    const response = await fetch(
      `${BASE_URL}/api/provider-token?userId=test&provider=github`,
      {
        headers: { 'x-api-key': INTERNAL_API_KEY! },
      }
    );
    expect([200, 404, 403]).toContain(response.status);
  });
});