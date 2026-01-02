import { PrismaService } from '../src/database/prisma.service';

const prisma = new PrismaService();

// Mock OpenAI globally for tests
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Mocked tone-enforced content.',
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

jest.setTimeout(30000);

afterAll(async () => {
  await prisma.$disconnect();
});