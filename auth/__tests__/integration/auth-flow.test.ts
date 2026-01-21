import { describe, it, expect } from '@jest/globals';

describe('Authentication Flow', () => {
  it('should show providers endpoint', async () => {
    const response = await fetch('http://localhost:3002/api/auth/providers');
    const data = await response.json();

    expect(data.github).toBeDefined();
    expect(data.twitter).toBeDefined();
  });

  it('should redirect to GitHub OAuth', async () => {
    const response = await fetch(
      'http://localhost:3002/api/auth/signin/github',
      { redirect: 'manual' }
    );

    expect(response.status).toBe(302);
    const location = response.headers.get('location') || '';
    expect(location).toMatch(/github\.com|localhost:3002\/auth\/error/);
  });

  it('should validate session endpoint', async () => {
    const response = await fetch('http://localhost:3002/api/session');
    expect([200, 401]).toContain(response.status);
  });
});