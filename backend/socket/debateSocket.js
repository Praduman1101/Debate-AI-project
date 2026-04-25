const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  createDebate,
  processUserArgument,
  processAITurn,
  abandonDebate,
  getDebateState,
} = require('../services/debateEngine');

// Active timers per debate: debateId -> { timer, timeLeft }
const debateTimers = new Map();

const clearDebateTimer = (debateId) => {
  const t = debateTimers.get(debateId);
  if (t) {
    clearInterval(t.interval);
    debateTimers.delete(debateId);
  }
};

const startTurnTimer = (io, debateId, roomId, turnSeconds = 30) => {
  clearDebateTimer(debateId);

  let timeLeft = turnSeconds;
  io.to(roomId).emit('timer:update', { timeLeft });

  const interval = setInterval(async () => {
    timeLeft -= 1;
    io.to(roomId).emit('timer:update', { timeLeft });

    if (timeLeft <= 0) {
      clearDebateTimer(debateId);
      io.to(roomId).emit('turn:timeout', { debateId });
      // Auto-submit empty turn and let AI respond
      try {
        await processUserArgument(debateId, { userId: null, text: '[No argument submitted — turn skipped]' });
        await handleAITurn(io, debateId, roomId);
      } catch (_) {}
    }
  }, 1000);

  debateTimers.set(debateId, { interval, timeLeft });
};

const handleAITurn = async (io, debateId, roomId) => {
  io.to(roomId).emit('ai:thinking', { debateId });

  try {
    const result = await processAITurn(debateId);
    if (!result) return;

    io.to(roomId).emit('ai:argument', {
      text:   result.text,
      scores: result.scores,
      nlp:    result.nlp,
      round:  result.debate.currentRound,
      status: result.debate.status,
    });

    if (result.debate.status === 'completed') {
      io.to(roomId).emit('debate:complete', {
        scores:   result.debate.scores,
        winner:   result.debate.winner,
        feedback: result.debate.feedback,
      });
      clearDebateTimer(debateId);
    } else {
      startTurnTimer(io, debateId, roomId, result.debate.config.turnTimeSeconds);
    }
  } catch (err) {
    io.to(roomId).emit('error', { message: 'AI failed to respond. Please try again.' });
  }
};

const initDebateSocket = (io) => {
  // JWT authentication middleware for sockets
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ─── Start a new debate ───────────────────────────────────────────────
    socket.on('debate:start', async (data) => {
      try {
        const { topicId, topicTitle, topicCategory, mode, stance, difficulty, totalRounds } = data;

        const debate = await createDebate({
          userId:        socket.user._id,
          topicId,
          topicTitle,
          topicCategory,
          mode:          mode || 'ai_vs_user',
          stance:        stance || 'for',
          difficulty:    difficulty || 'intermediate',
          totalRounds:   totalRounds || 4,
        });

        const roomId = `debate_${debate._id}`;
        socket.join(roomId);
        socket.currentDebateId = debate._id.toString();
        socket.currentRoomId   = roomId;

        socket.emit('debate:started', {
          debateId: debate._id,
          roomId,
          config:   debate.config,
          stances:  debate.stances,
          topic:    debate.topic,
        });

        startTurnTimer(io, debate._id.toString(), roomId, debate.config.turnTimeSeconds);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Reconnect to an existing debate ─────────────────────────────────
    socket.on('debate:reconnect', async ({ debateId }) => {
      try {
        const state = await getDebateState(debateId, socket.user._id);
        if (!state) return socket.emit('error', { message: 'Debate not found or access denied' });

        const roomId = `debate_${debateId}`;
        socket.join(roomId);
        socket.currentDebateId = debateId;
        socket.currentRoomId   = roomId;

        socket.emit('debate:state', state);

        if (state.status === 'active' && state.currentTurn === 'user') {
          startTurnTimer(io, debateId, roomId, state.config.turnTimeSeconds);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── User submits an argument ─────────────────────────────────────────
    socket.on('argument:submit', async ({ debateId, text, voiceInput }) => {
      try {
        clearDebateTimer(debateId);

        const { scores, nlp, debate } = await processUserArgument(debateId, {
          userId:     socket.user._id,
          text,
          voiceInput: voiceInput || false,
        });

        socket.emit('argument:scored', { text, scores, nlp, speaker: 'user' });

        const roomId = socket.currentRoomId || `debate_${debateId}`;
        await handleAITurn(io, debateId, roomId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── User abandons debate ─────────────────────────────────────────────
    socket.on('debate:abandon', async ({ debateId }) => {
      try {
        clearDebateTimer(debateId);
        await abandonDebate(debateId);
        socket.emit('debate:abandoned', { debateId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user?.username}`);
      if (socket.currentDebateId) {
        clearDebateTimer(socket.currentDebateId);
      }
    });
  });
};

module.exports = initDebateSocket;
