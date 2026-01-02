import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDb, teardownTestDb, prisma } from './test-db.setup';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await setupTestDb();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await teardownTestDb();
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'StrongP@ss123',
          name: 'New User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe('newuser@example.com');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject weak passwords', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test2@example.com',
          password: 'weak',
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'StrongP@ss123',
        });

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'StrongP@ss123',
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'login@example.com',
          password: 'StrongP@ss123',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'StrongP@ss123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe('login@example.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});