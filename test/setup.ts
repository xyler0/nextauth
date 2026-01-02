import { PrismaClient } from '../src/generated/prisma/client';

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