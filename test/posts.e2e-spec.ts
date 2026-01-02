import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDb, teardownTestDb, prisma } from './test-db.setup';
import { createTestUser } from './factories/user.factory';

describe('Posts E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

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

    const user = await createTestUser(prisma);
    userId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'Test123!@#',
      });

    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestDb();
    await app.close();
  });

  describe('POST /posts/manual', () => {
    it('should create manual post (dry run mode)', () => {
      return request(app.getHttpServer())
        .post('/posts/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Testing manual post creation. The system applies tone enforcement automatically.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('posted');
          // In dry run mode, might not actually post
        });
    });

    it('should reject short content', () => {
      return request(app.getHttpServer())
        .post('/posts/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Short',
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/posts/manual')
        .send({
          content: 'This should fail without auth',
        })
        .expect(401);
    });
  });

  describe('GET /posts', () => {
    it('should get user posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should support limit query parameter', () => {
      return request(app.getHttpServer())
        .get('/posts?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('GET /posts/stats', () => {
    it('should get posting statistics', () => {
      return request(app.getHttpServer())
        .get('/posts/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('todayCount');
          expect(res.body).toHaveProperty('maxPerDay');
          expect(res.body).toHaveProperty('canPostToday');
          expect(res.body).toHaveProperty('remaining');
          expect(typeof res.body.todayCount).toBe('number');
        });
    });
  });
});