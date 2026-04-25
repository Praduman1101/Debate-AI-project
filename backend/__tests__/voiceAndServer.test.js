const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs   = require('fs');

process.env.NODE_ENV          = 'test';
process.env.JWT_SECRET        = 'test_secret_key_32chars_long___!';
process.env.ANTHROPIC_API_KEY = 'test_key';
// Note: OPENAI_API_KEY deliberately not set → 503 expected

let mongod, app, token;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  ({ app } = require('../server'));

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'voiceuser', email: 'voice@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('POST /api/voice/transcribe', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/voice/transcribe')
      .attach('audio', Buffer.from('fake-audio'), 'test.m4a');
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when no audio file provided', async () => {
    const res = await request(app)
      .post('/api/voice/transcribe')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/No audio/i);
  });

  it('returns 503 when OPENAI_API_KEY is not configured', async () => {
    const res = await request(app)
      .post('/api/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .attach('audio', Buffer.from('fake-audio-data'), {
        filename:    'test.m4a',
        contentType: 'audio/m4a',
      });
    // Without OPENAI_API_KEY the route should return 503 (not configured)
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/not configured/i);
  });
});

describe('GET /health', () => {
  it('returns OK with uptime and environment', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.environment).toBe('test');
    expect(typeof res.body.uptime).toBe('string');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('Rate limiting', () => {
  it('health endpoint is not rate limited', async () => {
    // Fire 5 requests quickly — health is outside /api/ prefix so not rate-limited
    const results = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get('/health'))
    );
    results.forEach(r => expect(r.statusCode).toBe(200));
  });
});
