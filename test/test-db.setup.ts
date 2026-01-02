import { PrismaService } from '../src/database/prisma.service';

const prisma = new PrismaService();

export async function setupTestDb() {
  // Clean all tables
  await prisma.post.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.postingStats.deleteMany();
  await prisma.user.deleteMany();
}

export async function teardownTestDb() {
  // Clean up again after tests
  await setupTestDb();
  await prisma.$disconnect();
}

export { prisma };