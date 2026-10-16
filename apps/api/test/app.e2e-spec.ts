import { INestApplication } from '@nestjs/common';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from './test-utils';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('unhandled route should return formatted ErrorDto via GlobalExceptionFilter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/non-existent-endpoint')
      .expect(404);

    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('statusCode', 404);
    expect(res.body).toHaveProperty('error', 'Not Found');
    expect(res.body).toHaveProperty('message');
  });
});
