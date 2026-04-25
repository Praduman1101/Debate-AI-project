const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV      = 'test';
process.env.JWT_SECRET    = 'test_secret_key_for_jest';
process.env.JWT_EXPIRE    = '1d';
process.env.ANTHROPIC_API_KEY = 'test_key';

let mongod, app, token;

const SEED_TOPICS = [
  { title: 'AI is beneficial to society',    category: 'technology', difficulty: 'intermediate', trending: true,  totalDebates: 100 },
  { title: 'Nuclear energy solves climate',  category: 'climate',    difficulty: 'expert',       trending: false, totalDebates: 50  },
  { title: 'Online learning beats classroom',category: 'education',  difficulty: 'beginner',     trending: false, totalDebates: 30  },
];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  ({ app } = require('../server'));

  // Register user and get token
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'topicuser', email: 'topics@example.com', password: 'password123' });
  token = res.body.token;

  // Seed topics
  const Topic = require('../models/Topic');
  await Topic.insertMany(SEED_TOPICS);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('GET /api/topics', () => {
  it('should return all topics', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.statusCode).toBe(200);
    expect(res.body.topics.length).toBe(3);
  });

  it('should filter by category', async () => {
    const res = await request(app).get('/api/topics?category=technology');
    expect(res.statusCode).toBe(200);
    expect(res.body.topics.every(t => t.category === 'technology')).toBe(true);
  });

  it('should filter by difficulty', async () => {
    const res = await request(app).get('/api/topics?difficulty=beginner');
    expect(res.statusCode).toBe(200);
    expect(res.body.topics.every(t => t.difficulty === 'beginner')).toBe(true);
  });

  it('should search topics by title', async () => {
    const res = await request(app).get('/api/topics?search=nuclear');
    expect(res.statusCode).toBe(200);
    expect(res.body.topics.some(t => t.title.toLowerCase().includes('nuclear'))).toBe(true);
  });

  it('should respect the limit param', async () => {
    const res = await request(app).get('/api/topics?limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.topics.length).toBeLessThanOrEqual(2);
  });

  it('should return trending topics first when not filtering', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.statusCode).toBe(200);
    // Trending topics should appear before non-trending
    const trendingIdx    = res.body.topics.findIndex(t => t.trending);
    const nonTrendingIdx = res.body.topics.findIndex(t => !t.trending);
    if (trendingIdx !== -1 && nonTrendingIdx !== -1) {
      expect(trendingIdx).toBeLessThan(nonTrendingIdx);
    }
  });
});

describe('GET /api/topics/:id', () => {
  let topicId;

  beforeAll(async () => {
    const res = await request(app).get('/api/topics');
    topicId = res.body.topics[0]._id;
  });

  it('should return a single topic by id', async () => {
    const res = await request(app).get(`/api/topics/${topicId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.topic._id).toBe(topicId);
  });

  it('should return 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/api/topics/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});
