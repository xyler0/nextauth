import { PrismaClient } from '../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export async function createTestUser(
  prisma: PrismaClient,
  overrides: any = {},
) {
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  return prisma.user.create({
    data: {
      email: overrides.email ?? `test-${randomUUID()}@example.com`,
      password: hashedPassword,
      name: overrides.name ?? 'Test User',
      maxPostsPerDay: overrides.maxPostsPerDay ?? 3,
      ...overrides,
    },
  });
}


