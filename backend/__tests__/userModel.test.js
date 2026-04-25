const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_32chars_long!';

let mongod;
let User;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  User = require('../models/User');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

const makeUser = (overrides = {}) =>
  User.create({ username: 'testuser', email: 'test@example.com', password: 'password123', ...overrides });

// ── Schema validation ──────────────────────────────────────────────────
describe('User schema validation', () => {
  it('should create a valid user with default values', async () => {
    const user = await makeUser();
    expect(user._id).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.level).toBe(1);
    expect(user.xp).toBe(0);
    expect(user.stats.totalDebates).toBe(0);
    expect(user.stats.wins).toBe(0);
    expect(user.badges).toEqual([]);
  });

  it('should not expose password in default select', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    await makeUser();
    const found = await User.findOne({ username: 'testuser' });
    expect(found.password).toBeUndefined();
  });

  it('should require username', async () => {
    await expect(User.create({ email: 'a@b.com', password: 'pass123' })).rejects.toThrow();
  });

  it('should require email', async () => {
    await expect(User.create({ username: 'user1', password: 'pass123' })).rejects.toThrow();
  });

  it('should enforce unique email', async () => {
    await makeUser({ username: 'user1', email: 'dup@test.com' });
    await expect(makeUser({ username: 'user2', email: 'dup@test.com' })).rejects.toThrow();
  });

  it('should enforce unique username', async () => {
    await makeUser({ username: 'sameuser', email: 'one@test.com' });
    await expect(makeUser({ username: 'sameuser', email: 'two@test.com' })).rejects.toThrow();
  });

  it('should lowercase the email', async () => {
    const user = await makeUser({ email: 'Mixed@Case.COM' });
    expect(user.email).toBe('mixed@case.com');
  });
});

// ── Password hashing ───────────────────────────────────────────────────
describe('Password hashing', () => {
  it('should hash the password before saving', async () => {
    const user = await User.findOne({ email: 'test@example.com' }).select('+password');
    await makeUser();
    const created = await User.findOne({ username: 'testuser' }).select('+password');
    expect(created.password).not.toBe('password123');
    expect(created.password.startsWith('$2')).toBe(true); // bcrypt hash
  });

  it('matchPassword() should return true for correct password', async () => {
    const user = await User.findOne({ username: 'testuser' }).select('+password');
    await makeUser();
    const found = await User.findOne({ username: 'testuser' }).select('+password');
    const match = await found.matchPassword('password123');
    expect(match).toBe(true);
  });

  it('matchPassword() should return false for wrong password', async () => {
    await makeUser();
    const found = await User.findOne({ username: 'testuser' }).select('+password');
    const match = await found.matchPassword('wrongpassword');
    expect(match).toBe(false);
  });

  it('should re-hash when password is updated', async () => {
    await makeUser();
    const user = await User.findOne({ username: 'testuser' }).select('+password');
    const oldHash = user.password;
    user.password = 'newpassword456';
    await user.save();
    const updated = await User.findOne({ username: 'testuser' }).select('+password');
    expect(updated.password).not.toBe(oldHash);
    expect(await updated.matchPassword('newpassword456')).toBe(true);
  });
});

// ── JWT token ──────────────────────────────────────────────────────────
describe('JWT token', () => {
  it('getSignedToken() should return a valid JWT string', async () => {
    await makeUser();
    const user  = await User.findOne({ username: 'testuser' });
    const token = user.getSignedToken();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

// ── updateStats() ──────────────────────────────────────────────────────
describe('updateStats()', () => {
  it('should increment totalDebates and wins on a win', async () => {
    await makeUser();
    const user = await User.findOne({ username: 'testuser' });
    await user.updateStats({ won: true, totalScore: 80, logic: 78, clarity: 82, confidence: 75 });
    const updated = await User.findById(user._id);
    expect(updated.stats.totalDebates).toBe(1);
    expect(updated.stats.wins).toBe(1);
    expect(updated.stats.losses).toBe(0);
    expect(updated.xp).toBe(100); // win XP
  });

  it('should increment losses on a loss', async () => {
    await makeUser();
    const user = await User.findOne({ username: 'testuser' });
    await user.updateStats({ won: false, totalScore: 60, logic: 55, clarity: 62, confidence: 58 });
    const updated = await User.findById(user._id);
    expect(updated.stats.losses).toBe(1);
    expect(updated.xp).toBe(40); // loss XP
  });

  it('should compute correct averages across multiple debates', async () => {
    await makeUser();
    const user = await User.findOne({ username: 'testuser' });
    await user.updateStats({ won: true,  totalScore: 80, logic: 80, clarity: 80, confidence: 80 });
    const u2 = await User.findById(user._id);
    await u2.updateStats({ won: false, totalScore: 60, logic: 60, clarity: 60, confidence: 60 });
    const final = await User.findById(user._id);
    expect(final.stats.totalDebates).toBe(2);
    expect(final.stats.avgScore).toBe(70);
  });

  it('should increase level when XP threshold is crossed', async () => {
    await makeUser();
    const user = await User.findOne({ username: 'testuser' });
    // 5 wins × 100 XP = 500 XP → Level 2
    for (let i = 0; i < 5; i++) {
      const u = await User.findById(user._id);
      await u.updateStats({ won: true, totalScore: 80, logic: 80, clarity: 80, confidence: 80 });
    }
    const updated = await User.findById(user._id);
    expect(updated.xp).toBe(500);
    expect(updated.level).toBe(2);
  });
});
