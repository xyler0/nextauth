import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDb, teardownTestDb, prisma } from './test-db.setup';
import { createTestUser } from './factories/user.factory';

describe('Journal E2E', () => {
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

    // Create test user and get token
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

  describe('POST /journal', () => {
    it('should create journal entry', () => {
      return request(app.getHttpServer())
        .post('/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Today I built a new feature for the posting system. It now automatically detects GitHub commits and generates posts in my voice. The scoring algorithm works well.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.processed).toBe(false);
        });
    });

    it('should reject short content', () => {
      return request(app.getHttpServer())
        .post('/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Too short',
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/journal')
        .send({
          content: 'This should fail without auth token'.repeat(10),
        })
        .expect(401);
    });
  });

  describe('GET /journal', () => {
    it('should get user journal entries', async () => {
      // Create a journal entry first
      await request(app.getHttpServer())
        .post('/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test journal entry for retrieval testing. This has enough content to pass validation.'.repeat(2),
        });

      return request(app.getHttpServer())
        .get('/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('POST /journal/:id/process', () => {
    it('should process journal entry', async () => {
      // Create entry
      const createRes = await request(app.getHttpServer())
        .post('/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Today I shipped a major feature. The algorithm now scores text segments based on conviction, novelty, and signal. Performance improved significantly.',
        });

      const entryId = createRes.body.id;

      return request(app.getHttpServer())
        .post(`/journal/${entryId}/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('segments');
          expect(Array.isArray(res.body.segments)).toBe(true);
          expect(res.body.segments.length).toBeGreaterThan(0);
          expect(res.body.segments.length).toBeLessThanOrEqual(2);
        });
    });

    it('should not allow processing others journal', async () => {
      // Create another user
      const otherUser = await createTestUser(prisma, {
        email: 'other@example.com',
      });

      // Create entry for other user
      const entry = await prisma.journalEntry.create({
        data: {
          content: 'This is someone elses journal entry.',
          userId: otherUser.id,
        },
      });

      return request(app.getHttpServer())
        .post(`/journal/${entry.id}/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});