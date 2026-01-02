import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDb, teardownTestDb, prisma } from './test-db.setup';
import { createTestUser } from './factories/user.factory';

describe('User E2E', () => {
  let app: INestApplication;
  let authToken: string;

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

  describe('GET /user/profile', () => {
    it('should get user profile', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('maxPostsPerDay');
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('xApiKey');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });
  });

  describe('PUT /user/settings', () => {
    it('should update user settings', () => {
      return request(app.getHttpServer())
        .put('/user/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxPostsPerDay: 5,
          name: 'Updated Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('updated');
        });
    });

    it('should validate maxPostsPerDay range', () => {
      return request(app.getHttpServer())
        .put('/user/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxPostsPerDay: 20, // Exceeds max
        })
        .expect(400);
    });
  });

  describe('PUT /user/github-settings', () => {
    it('should update GitHub settings', () => {
      return request(app.getHttpServer())
        .put('/user/github-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          githubUsername: 'testuser',
          githubRepos: ['testuser/repo1', 'testuser/repo2'],
        })
        .expect(200);
    });
  });

  describe('GET /user/x-credentials/verify', () => {
    it('should verify X credentials (dry run)', () => {
      return request(app.getHttpServer())
        .get('/user/x-credentials/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('valid');
          expect(typeof res.body.valid).toBe('boolean');
        });
    });
  });
});