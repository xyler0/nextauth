import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  githubId: string | null;
  githubAccessToken: string | null;
  githubUsername: string | null;
  githubRepos: string[];
  xId: string | null;
  xAccessToken: string | null;
  xRefreshToken: string | null;
  xApiSecret: string | null;
  xApiKey: string | null;
  xUsername: string | null;
  xAccessSecret: string | null;
  xExpiresAt: Date | null;
  xScope: string | null;
  maxPostsPerDay: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

const userFactory = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'user1',
  email: 'test@example.com',
  password: 'hashed-password',
  name: 'Test User',
  githubId: null,
  githubAccessToken: null,
  githubUsername: null,
  githubRepos: [],
  xId: null,
  xAccessToken: null,
  xRefreshToken: null,
  xApiSecret: null,
  xApiKey: null,
  xUsername: null,
  xAccessSecret: null,
  xExpiresAt: null,
  xScope: null,
  maxPostsPerDay: 5,
  timezone: 'UTC',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('creates a new user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(
        userFactory(),
      );

      const result = await service.signup({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws ConflictException if user exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(
        userFactory(),
      );

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'Test123!@#',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(
        userFactory(),
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(jwt.sign).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('throws UnauthorizedException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'missing@example.com',
          password: 'Test123!@#',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for invalid password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(
        userFactory(),
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
