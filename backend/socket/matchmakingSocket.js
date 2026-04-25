/**
 * Matchmaking Socket Handler
 * Manages a waiting queue for User vs User debates.
 * When two users with matching criteria are found, creates a shared debate room.
 *
 * Already registered in server.js:
 *   const initMatchmaking = require('./socket/matchmakingSocket');
 *   initMatchmaking(io);
 */

const Debate = require('../models/Debate');
const { v4: uuidv4 } = require('uuid');

// In-memory queue: [{ socket, userId, username, topicId, topicTitle, stance, difficulty, joinedAt }]
const waitingQueue = [];

const MATCH_TIMEOUT_MS = 60000; // 1 minute

const findMatch = (entry) => {
  return waitingQueue.find(other =>
    other.socket.id !== entry.socket.id &&
    other.topicId   === entry.topicId
  );
};

const removeFromQueue = (socketId) => {
  const idx = waitingQueue.findIndex(e => e.socket.id === socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
};

const initMatchmaking = (io) => {
  io.on('connection', (socket) => {

    // ── Join matchmaking queue ─────────────────────────────────────────────
    socket.on('matchmaking:join', async (data) => {
      const { topicId, topicTitle, topicCategory, stance, difficulty } = data;

      // Don't add duplicates
      removeFromQueue(socket.id);

      const entry = {
        socket, userId: socket.user._id, username: socket.user.username,
        topicId, topicTitle, topicCategory, stance, difficulty,
        joinedAt: Date.now(),
      };

      // Check for existing match
      const match = findMatch(entry);

      if (match) {
        // Remove matched user from queue
        removeFromQueue(match.socket.id);

        const roomId = `pvp_${uuidv4()}`;

        // Assign opposite stances if both chose the same
        const userStance     = stance;
        const opponentStance = stance === 'for' ? 'against' : 'for';

        // Create debate in DB
        const debate = await Debate.create({
          topic:        { id: topicId, title: topicTitle, category: topicCategory },
          mode:         'user_vs_user',
          status:       'active',
          participants: { user: socket.user._id, opponent: match.userId },
          stances:      { user: userStance, opponent: opponentStance },
          difficulty,
          config:       { totalRounds: 4, turnTimeSeconds: 30 },
          currentRound: 1,
          currentTurn:  'user',
          roomId,
          startedAt:    new Date(),
        });

        // Join both sockets to the shared room
        socket.join(roomId);
        match.socket.join(roomId);

        // Notify both players
        const payload = {
          debateId:  debate._id,
          roomId,
          topic:     debate.topic,
          config:    debate.config,
        };

        socket.emit('matchmaking:matched', {
          ...payload,
          yourStance:      userStance,
          opponentName:    match.username,
          isFirstTurn:     true,
        });
        match.socket.emit('matchmaking:matched', {
          ...payload,
          yourStance:      opponentStance,
          opponentName:    socket.user.username,
          isFirstTurn:     false,
        });

        io.to(roomId).emit('debate:started', payload);
        console.log(`⚔️  Matched: ${socket.user.username} vs ${match.username} on "${topicTitle}"`);
      } else {
        // Add to queue and wait
        waitingQueue.push(entry);
        socket.emit('matchmaking:waiting', {
          queuePosition: waitingQueue.length,
          topic:         topicTitle,
        });

        // Auto-remove from queue after timeout
        setTimeout(() => {
          removeFromQueue(socket.id);
          socket.emit('matchmaking:timeout', { message: 'No opponent found. Try again or switch to AI mode.' });
        }, MATCH_TIMEOUT_MS);

        console.log(`⏳ Queued: ${socket.user.username} for "${topicTitle}" (queue size: ${waitingQueue.length})`);
      }
    });

    // ── Leave matchmaking queue ────────────────────────────────────────────
    socket.on('matchmaking:leave', () => {
      removeFromQueue(socket.id);
      socket.emit('matchmaking:left');
    });

    // ── Queue status ───────────────────────────────────────────────────────
    socket.on('matchmaking:status', () => {
      const inQueue = waitingQueue.some(e => e.socket.id === socket.id);
      socket.emit('matchmaking:status_response', {
        inQueue,
        queueSize: waitingQueue.length,
      });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      removeFromQueue(socket.id);
    });
  });
};

module.exports = initMatchmaking;
