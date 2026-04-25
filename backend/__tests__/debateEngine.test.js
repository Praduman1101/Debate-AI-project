const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV          = 'test';
process.env.JWT_SECRET        = 'test_secret_key';
process.env.ANTHROPIC_API_KEY = 'test_key';

// Mock aiService so tests don't call the real Anthropic API
jest.mock('../services/aiService', () => ({
  generateAIArgument: jest.fn().mockResolvedValue(
    'AI counter-argument: While the risks are real, the benefits of technology outweigh them significantly.'
  ),
  generateFeedback: jest.fn().mockResolvedValue({
    strengths:    ['Good use of examples', 'Clear structure'],
    weaknesses:   ['Could cite more data'],
    improvements: ['Use the claim-evidence-impact structure'],
    summary:      'A competitive debate showing clear potential.',
    winner:       'user',
  }),
  scoreArgument: jest.fn().mockResolvedValue({
    logic: 78, relevance: 82, clarity: 75, confidence: 80, reasoning: 'Solid argument.',
  }),
}));

jest.mock('../services/nlpService', () => ({
  analyzeArgument: jest.fn().mockReturnValue({
    sentiment: 'positive', intent: 'claim', keywords: ['AI', 'technology'],
    complexity: 55, wordCount: 20, sentimentScore: 2,
  }),
  computeSimilarity: jest.fn().mockReturnValue(0.1),
}));

let mongod;
let Debate, User, Topic;
let createDebate, processUserArgument, processAITurn, concludeDebate, abandonDebate;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  Debate = require('../models/Debate');
  User   = require('../models/User');
  Topic  = require('../models/Topic');

  ({ createDebate, processUserArgument, processAITurn, concludeDebate, abandonDebate } =
    require('../services/debateEngine'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Debate.deleteMany({});
  await User.deleteMany({});
});

const makeUser = async (username = 'debater') => {
  return User.create({ username, email: `${username}@test.com`, password: 'password123' });
};

describe('createDebate()', () => {
  it('should create a debate with correct initial state', async () => {
    const user   = await makeUser();
    const debate = await createDebate({
      userId:        user._id,
      topicId:       new mongoose.Types.ObjectId(),
      topicTitle:    'AI is beneficial',
      topicCategory: 'technology',
      mode:          'ai_vs_user',
      stance:        'for',
      difficulty:    'intermediate',
      totalRounds:   4,
    });

    expect(debate).toBeDefined();
    expect(debate.status).toBe('active');
    expect(debate.currentRound).toBe(1);
    expect(debate.currentTurn).toBe('user');
    expect(debate.stances.user).toBe('for');
    expect(debate.stances.opponent).toBe('against');
    expect(debate.config.totalRounds).toBe(4);
    expect(debate.config.turnTimeSeconds).toBe(30);
    expect(debate.arguments).toHaveLength(0);
  });

  it('should assign opposite stance to opponent', async () => {
    const user = await makeUser('user2');
    const d    = await createDebate({
      userId: user._id, topicId: new mongoose.Types.ObjectId(),
      topicTitle: 'Test', topicCategory: 'technology',
      mode: 'ai_vs_user', stance: 'against',
      difficulty: 'beginner', totalRounds: 2,
    });
    expect(d.stances.opponent).toBe('for');
  });
});

describe('processUserArgument()', () => {
  let user, debate;

  beforeEach(async () => {
    user   = await makeUser('arguser');
    debate = await createDebate({
      userId: user._id, topicId: new mongoose.Types.ObjectId(),
      topicTitle: 'AI is beneficial', topicCategory: 'technology',
      mode: 'ai_vs_user', stance: 'for',
      difficulty: 'intermediate', totalRounds: 4,
    });
  });

  it('should add user argument and change turn to AI', async () => {
    const result = await processUserArgument(debate._id, {
      userId: user._id,
      text:   'AI has significantly improved healthcare diagnostics and reduced medical errors worldwide.',
    });

    expect(result.scores).toBeDefined();
    expect(result.scores.logic).toBeGreaterThanOrEqual(0);
    expect(result.debate.currentTurn).toBe('ai');
    expect(result.debate.arguments).toHaveLength(1);
    expect(result.debate.arguments[0].speaker).toBe('user');
    expect(result.nlp.intent).toBeDefined();
  });

  it('should throw if debate is not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(
      processUserArgument(fakeId, { userId: user._id, text: 'Test argument here' })
    ).rejects.toThrow('Debate not found');
  });

  it('should throw if it is not user\'s turn', async () => {
    // Set turn to AI
    await Debate.findByIdAndUpdate(debate._id, { currentTurn: 'ai' });
    await expect(
      processUserArgument(debate._id, { userId: user._id, text: 'My argument text' })
    ).rejects.toThrow("Not your turn");
  });
});

describe('processAITurn()', () => {
  it('should add AI argument and advance round', async () => {
    const user   = await makeUser('aiturnuser');
    const debate = await createDebate({
      userId: user._id, topicId: new mongoose.Types.ObjectId(),
      topicTitle: 'AI is beneficial', topicCategory: 'technology',
      mode: 'ai_vs_user', stance: 'for',
      difficulty: 'intermediate', totalRounds: 4,
    });

    // First submit user argument to change turn to AI
    await processUserArgument(debate._id, {
      userId: user._id,
      text: 'AI has transformed medicine, logistics, and scientific research for the better.',
    });

    const result = await processAITurn(debate._id);

    expect(result).not.toBeNull();
    expect(result.text).toBeTruthy();
    expect(result.debate.arguments).toHaveLength(2);
    expect(result.debate.arguments[1].speaker).toBe('ai');
    expect(result.debate.currentRound).toBe(2);
    expect(result.debate.currentTurn).toBe('user');
  });
});

describe('concludeDebate()', () => {
  it('should mark debate as completed and compute scores', async () => {
    const user   = await makeUser('concludeuser');
    const d      = await createDebate({
      userId: user._id, topicId: new mongoose.Types.ObjectId(),
      topicTitle: 'AI is beneficial', topicCategory: 'technology',
      mode: 'ai_vs_user', stance: 'for',
      difficulty: 'intermediate', totalRounds: 1,
    });

    // Add some arguments manually
    d.arguments.push({ speaker: 'user', text: 'AI helps many fields.', round: 1, scores: { logic: 80, relevance: 75, clarity: 85, confidence: 70 } });
    d.arguments.push({ speaker: 'ai',   text: 'AI also has risks.',    round: 1, scores: { logic: 70, relevance: 80, clarity: 75, confidence: 65 } });
    d.markModified('arguments');
    await d.save();

    const concluded = await concludeDebate(d);

    expect(concluded.status).toBe('completed');
    expect(concluded.winner).toBeDefined();
    expect(['user','opponent','draw']).toContain(concluded.winner);
    expect(concluded.scores.user.total).toBeGreaterThan(0);
    expect(concluded.feedback).toBeDefined();
    expect(Array.isArray(concluded.feedback.strengths)).toBe(true);
    expect(concluded.completedAt).toBeDefined();
  });
});

describe('abandonDebate()', () => {
  it('should mark debate as abandoned', async () => {
    const user   = await makeUser('abandonuser');
    const debate = await createDebate({
      userId: user._id, topicId: new mongoose.Types.ObjectId(),
      topicTitle: 'Test', topicCategory: 'technology',
      mode: 'ai_vs_user', stance: 'for',
      difficulty: 'beginner', totalRounds: 4,
    });

    await abandonDebate(debate._id);
    const updated = await Debate.findById(debate._id);
    expect(updated.status).toBe('abandoned');
    expect(updated.completedAt).toBeDefined();
  });
});
