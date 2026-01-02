import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

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
              create: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

      const result = await service.signup({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should throw ConflictException if user exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
      } as any);

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'Test123!@#',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test123!@#', 10);
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('Test123!@#', 10);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user1',
        password: hashedPassword,
      } as any);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});