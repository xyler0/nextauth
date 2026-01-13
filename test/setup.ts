import { PrismaService } from '../src/database/prisma.service';

const prisma = new PrismaService();

// Mock OpenAI globally for tests
jest.mock('openai', () => ({
  __esModule: true, // required for default import
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            { message: { content: 'Mocked tone-enforced content.' } },
          ],
        }),
      },
    },
  })),
}));

// Mock Octokit globally
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn().mockResolvedValue({
            data: [],
          }),
        },
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: 'testuser' },
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