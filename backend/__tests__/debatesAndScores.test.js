const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV          = 'test';
process.env.JWT_SECRET        = 'test_secret_key';
process.env.ANTHROPIC_API_KEY = 'test_key';

let mongod, app, token, userId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  ({ app } = require('../server'));

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'histuser', email: 'hist@example.com', password: 'password123' });
  token  = res.body.token;
  userId = res.body.user._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const Debate = require('../models/Debate');
  await Debate.deleteMany({});
});

// ── Helpers ────────────────────────────────────────────────────────────────
const seedDebate = async (overrides = {}) => {
  const Debate = require('../models/Debate');
  return Debate.create({
    topic:        { title: 'AI is beneficial', category: 'technology' },
    mode:         'ai_vs_user',
    status:       'completed',
    participants: { user: userId },
    stances:      { user: 'for', opponent: 'against' },
    difficulty:   'intermediate',
    config:       { totalRounds: 4, turnTimeSeconds: 30 },
    currentRound: 4,
    currentTurn:  'user',
    winner:       'user',
    scores: {
      user:     { logic: 82, relevance: 78, clarity: 85, confidence: 80, total: 81 },
      opponent: { logic: 70, relevance: 72, clarity: 68, confidence: 65, total: 69 },
    },
    feedback: {
      strengths:    ['Clear structure', 'Good examples'],
      weaknesses:   ['Needs more data'],
      improvements: ['Use claim-evidence-impact'],
      summary:      'Strong debate overall.',
    },
    completedAt: new Date(),
    duration:    240,
    ...overrides,
  });
};

// ── GET /api/debates ───────────────────────────────────────────────────────
describe('GET /api/debates', () => {
  it('returns empty list when no debates', async () => {
    const res = await request(app)
      .get('/api/debates')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.debates).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('returns user debates paginated', async () => {
    await Promise.all([seedDebate(), seedDebate(), seedDebate()]);
    const res = await request(app)
      .get('/api/debates?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.debates.length).toBeLessThanOrEqual(2);
    expect(res.body.total).toBe(3);
    expect(res.body.pages).toBe(2);
  });

  it('filters by status', async () => {
    await seedDebate({ status: 'completed' });
    await seedDebate({ status: 'abandoned' });
    const res = await request(app)
      .get('/api/debates?status=completed')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.debates.every(d => d.status === 'completed')).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/debates');
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /api/debates/:id ───────────────────────────────────────────────────
describe('GET /api/debates/:id', () => {
  it('returns debate with full arguments', async () => {
    const debate = await seedDebate();
    const res    = await request(app)
      .get(`/api/debates/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.debate._id).toBe(debate._id.toString());
    expect(res.body.debate.scores).toBeDefined();
    expect(res.body.debate.feedback).toBeDefined();
  });

  it('returns 404 for unknown ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app)
      .get(`/api/debates/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 for another user\'s debate', async () => {
    const Debate = require('../models/Debate');
    const otherId = new mongoose.Types.ObjectId();
    const debate  = await Debate.create({
      topic: { title: 'Test', category: 'technology' },
      mode:  'ai_vs_user', status: 'completed',
      participants: { user: otherId },
      stances: { user: 'for', opponent: 'against' },
      difficulty: 'beginner',
      config: { totalRounds: 2, turnTimeSeconds: 30 },
      currentRound: 2, currentTurn: 'user',
    });
    const res = await request(app)
      .get(`/api/debates/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});

// ── DELETE /api/debates/:id ────────────────────────────────────────────────
describe('DELETE /api/debates/:id', () => {
  it('deletes a debate', async () => {
    const debate = await seedDebate();
    const res    = await request(app)
      .delete(`/api/debates/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const check = await request(app)
      .get(`/api/debates/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.statusCode).toBe(404);
  });
});

// ── GET /api/scores/me ─────────────────────────────────────────────────────
describe('GET /api/scores/me', () => {
  it('returns user stats and recent debates', async () => {
    await seedDebate();
    const res = await request(app)
      .get('/api/scores/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(Array.isArray(res.body.recentDebates)).toBe(true);
  });
});

// ── POST /api/scores/finalize/:id ──────────────────────────────────────────
describe('POST /api/scores/finalize/:debateId', () => {
  it('updates user stats after completing a debate', async () => {
    const debate = await seedDebate();
    const res    = await request(app)
      .post(`/api/scores/finalize/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalDebates).toBe(1);
    expect(res.body.stats.wins).toBe(1);
  });

  it('returns 400 for non-completed debate', async () => {
    const debate = await seedDebate({ status: 'active', winner: null });
    const res    = await request(app)
      .post(`/api/scores/finalize/${debate._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });
});

// ── GET /api/debates/stats/leaderboard ────────────────────────────────────
describe('GET /api/debates/stats/leaderboard', () => {
  it('returns an array', async () => {
    const res = await request(app).get('/api/debates/stats/leaderboard');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.leaderboard)).toBe(true);
  });
});
