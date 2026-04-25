const { createServer } = require('http');
const { Server }       = require('socket.io');
const { io: Client }   = require('socket.io-client');
const mongoose         = require('mongoose');
const jwt              = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV          = 'test';
process.env.JWT_SECRET        = 'test_secret_socket_key_32chars!!';
process.env.ANTHROPIC_API_KEY = 'test_key';

// Mock AI service — make it deterministic for socket tests
jest.mock('../services/aiService', () => ({
  generateAIArgument: jest.fn().mockResolvedValue(
    'While the risks are real, the benefits clearly outweigh them.'
  ),
  generateFeedback: jest.fn().mockResolvedValue({
    strengths:    ['Good structure'],
    weaknesses:   ['Needs more evidence'],
    improvements: ['Use the claim-evidence-impact format'],
    summary:      'Competitive debate. Keep practicing.',
    winner:       'user',
  }),
  scoreArgument: jest.fn().mockResolvedValue({
    logic: 80, relevance: 75, clarity: 85, confidence: 78, reasoning: 'Solid argument.',
  }),
}));

jest.mock('../services/nlpService', () => ({
  analyzeArgument:   jest.fn().mockReturnValue({ sentiment: 'positive', intent: 'claim', keywords: ['AI'], complexity: 50, wordCount: 15, sentimentScore: 2 }),
  computeSimilarity: jest.fn().mockReturnValue(0.1),
}));

let mongod, httpServer, ioServer, clientSocket, testUserId, testToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  await mongoose.connect(mongod.getUri());

  // Create a test user directly in DB
  const User = require('../models/User');
  const user = await User.create({
    username: 'socketuser',
    email:    'socket@test.com',
    password: 'password123',
  });
  testUserId = user._id;
  testToken  = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Boot the actual server
  const { server, io } = require('../server');
  httpServer = server;
  ioServer   = io;
});

afterAll(async () => {
  if (clientSocket?.connected) clientSocket.disconnect();
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const Debate = require('../models/Debate');
  await Debate.deleteMany({});
  if (clientSocket?.connected) {
    clientSocket.removeAllListeners();
  }
});

/** Create a connected socket client authenticated as testUser */
const connectClient = (token = testToken) => {
  return new Promise((resolve, reject) => {
    const PORT   = process.env.PORT || 5000;
    const socket = Client(`http://localhost:${PORT}`, {
      auth:      { token },
      transports: ['websocket'],
      timeout:    5000,
    });
    socket.on('connect',       () => resolve(socket));
    socket.on('connect_error', reject);
  });
};

// ── Authentication ─────────────────────────────────────────────────────────
describe('Socket authentication', () => {
  it('rejects connection without a token', async () => {
    await expect(connectClient('')).rejects.toBeDefined();
  });

  it('rejects connection with an invalid token', async () => {
    await expect(connectClient('invalid.token.here')).rejects.toBeDefined();
  });

  it('connects successfully with a valid JWT', async () => {
    clientSocket = await connectClient();
    expect(clientSocket.connected).toBe(true);
    clientSocket.disconnect();
  });
});

// ── Debate flow ────────────────────────────────────────────────────────────
describe('debate:start → argument:submit → debate:complete', () => {
  let socket;

  beforeEach(async () => { socket = await connectClient(); });
  afterEach(() => { if (socket?.connected) socket.disconnect(); });

  it('emits debate:started after debate:start', (done) => {
    socket.emit('debate:start', {
      topicId:       new mongoose.Types.ObjectId().toString(),
      topicTitle:    'AI is beneficial to humanity',
      topicCategory: 'technology',
      mode:          'ai_vs_user',
      stance:        'for',
      difficulty:    'intermediate',
      totalRounds:   2,
    });

    socket.on('debate:started', (data) => {
      expect(data.debateId).toBeDefined();
      expect(data.config.totalRounds).toBe(2);
      expect(data.stances.user).toBe('for');
      expect(data.stances.opponent).toBe('against');
      done();
    });
  });

  it('processes a full 1-round debate end-to-end', (done) => {
    let debateId;

    socket.emit('debate:start', {
      topicId:       new mongoose.Types.ObjectId().toString(),
      topicTitle:    'AI is beneficial',
      topicCategory: 'technology',
      mode:          'ai_vs_user',
      stance:        'for',
      difficulty:    'beginner',
      totalRounds:   1,
    });

    socket.on('debate:started', (data) => {
      debateId = data.debateId;
    });

    socket.on('timer:update', () => {
      // Submit argument when we receive the first timer tick
      if (debateId && socket.connected) {
        socket.off('timer:update'); // only submit once
        socket.emit('argument:submit', {
          debateId,
          text:       'Artificial intelligence has significantly improved healthcare outcomes and scientific research globally.',
          voiceInput: false,
        });
      }
    });

    socket.on('argument:scored', (data) => {
      expect(data.speaker).toBe('user');
      expect(data.scores.logic).toBeGreaterThan(0);
      expect(data.nlp.intent).toBeDefined();
    });

    socket.on('debate:complete', (data) => {
      expect(data.winner).toBeDefined();
      expect(['user','opponent','draw']).toContain(data.winner);
      expect(data.feedback.strengths.length).toBeGreaterThan(0);
      expect(data.scores.user.total).toBeGreaterThan(0);
      done();
    });
  }, 20000);

  it('emits error when submitting on wrong turn', (done) => {
    let debateId;

    socket.emit('debate:start', {
      topicId:       new mongoose.Types.ObjectId().toString(),
      topicTitle:    'Climate change needs urgent action',
      topicCategory: 'climate',
      mode:          'ai_vs_user',
      stance:        'for',
      difficulty:    'beginner',
      totalRounds:   2,
    });

    socket.on('debate:started', (data) => {
      debateId = data.debateId;
      // Submit once correctly
      socket.emit('argument:submit', { debateId, text: 'Climate change is the defining challenge of our time and requires immediate action.' });
    });

    socket.on('ai:thinking', () => {
      // Try to submit again while AI is thinking — should get error
      socket.emit('argument:submit', { debateId, text: 'Another argument attempt.' });
    });

    socket.on('error', (data) => {
      expect(data.message).toMatch(/not your turn/i);
      done();
    });
  }, 15000);
});

// ── Matchmaking ────────────────────────────────────────────────────────────
describe('Matchmaking', () => {
  let socket1, socket2;

  afterEach(() => {
    socket1?.disconnect();
    socket2?.disconnect();
  });

  it('single user receives waiting status', (done) => {
    connectClient().then(socket => {
      socket1 = socket;
      socket.emit('matchmaking:join', {
        topicId:       new mongoose.Types.ObjectId().toString(),
        topicTitle:    'Universal Basic Income',
        topicCategory: 'economy',
        stance:        'for',
        difficulty:    'intermediate',
      });

      socket.on('matchmaking:waiting', (data) => {
        expect(data.queuePosition).toBeGreaterThanOrEqual(1);
        done();
      });
    });
  });

  it('leaving queue stops waiting', (done) => {
    connectClient().then(socket => {
      socket1 = socket;
      socket.emit('matchmaking:join', {
        topicId:       new mongoose.Types.ObjectId().toString(),
        topicTitle:    'Remote work future',
        topicCategory: 'economy',
        stance:        'for',
        difficulty:    'beginner',
      });

      socket.on('matchmaking:waiting', () => {
        socket.emit('matchmaking:leave');
        socket.on('matchmaking:left', () => done());
      });
    });
  });
});

// ── Debate abandon ─────────────────────────────────────────────────────────
describe('debate:abandon', () => {
  it('marks debate as abandoned', (done) => {
    connectClient().then(socket => {
      socket.emit('debate:start', {
        topicId:       new mongoose.Types.ObjectId().toString(),
        topicTitle:    'Test topic',
        topicCategory: 'technology',
        mode:          'ai_vs_user',
        stance:        'for',
        difficulty:    'beginner',
        totalRounds:   4,
      });

      socket.on('debate:started', ({ debateId }) => {
        socket.emit('debate:abandon', { debateId });
        socket.on('debate:abandoned', () => {
          socket.disconnect();
          done();
        });
      });
    });
  });
});
