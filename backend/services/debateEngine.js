const Debate  = require('../models/Debate');
const { generateAIArgument, generateFeedback } = require('./aiService');
const { scoreDebateArgument, computeDebateScores } = require('./scoringEngine');
const { incrementTopicDebateCount } = require('./topicService');

/**
 * Create a new debate session
 */
const createDebate = async ({ userId, topicId, topicTitle, topicCategory, mode, stance, difficulty, totalRounds = 4 }) => {
  const debate = new Debate({
    topic: { id: topicId, title: topicTitle, category: topicCategory },
    mode,
    status: 'active',
    participants: { user: userId },
    stances: {
      user:     stance,
      opponent: stance === 'for' ? 'against' : 'for',
    },
    difficulty,
    config: { totalRounds, turnTimeSeconds: 30 },
    currentRound: 1,
    currentTurn: 'user',
    startedAt: new Date(),
  });

  await debate.save();
  // Track topic usage (fire-and-forget)
  incrementTopicDebateCount(topicId);
  return debate;
};

/**
 * Process a user's submitted argument
 */
const processUserArgument = async (debateId, { userId, text, voiceInput = false }) => {
  const debate = await Debate.findById(debateId);
  if (!debate) throw new Error('Debate not found');
  if (debate.status !== 'active') throw new Error('Debate is not active');
  if (debate.currentTurn !== 'user') throw new Error('Not your turn');

  // Score the user argument
  const { scores, nlp } = await scoreDebateArgument({
    argument: text,
    topic: debate.topic.title,
    stance: debate.stances.user,
    previousArguments: debate.arguments,
    round: debate.currentRound,
  });

  // Add argument
  debate.arguments.push({
    speaker: 'user',
    speakerId: userId,
    text,
    round: debate.currentRound,
    scores,
    nlp,
    voiceInput,
  });

  debate.currentTurn = 'ai';
  debate.markModified('arguments');
  await debate.save();

  return { scores, nlp, debate };
};

/**
 * Generate and process AI's argument
 */
const processAITurn = async (debateId) => {
  const debate = await Debate.findById(debateId);
  if (!debate || debate.status !== 'active') return null;

  const history = debate.arguments.map(a => ({ speaker: a.speaker, text: a.text }));

  // Generate AI argument
  const aiText = await generateAIArgument({
    topic: debate.topic.title,
    stance: debate.stances.opponent,
    history,
    difficulty: debate.difficulty,
    round: debate.currentRound,
    totalRounds: debate.config.totalRounds,
  });

  // Score AI argument
  const { scores, nlp } = await scoreDebateArgument({
    argument: aiText,
    topic: debate.topic.title,
    stance: debate.stances.opponent,
    previousArguments: debate.arguments,
    round: debate.currentRound,
  });

  debate.arguments.push({
    speaker: 'ai',
    text: aiText,
    round: debate.currentRound,
    scores,
    nlp,
  });

  // Advance round or end debate
  if (debate.currentRound >= debate.config.totalRounds) {
    await concludeDebate(debate);
  } else {
    debate.currentRound += 1;
    debate.currentTurn = 'user';
    debate.markModified('arguments');
    await debate.save();
  }

  return { text: aiText, scores, nlp, debate };
};

/**
 * Conclude the debate — compute final scores and generate feedback
 */
const concludeDebate = async (debate) => {
  debate.status = 'completed';
  debate.completedAt = new Date();
  debate.duration = Math.round((debate.completedAt - debate.startedAt) / 1000);

  // Recalculate scores
  const finalScores = computeDebateScores(debate.arguments);
  debate.scores = finalScores;

  // Determine winner
  debate.winner = finalScores.user.total > finalScores.opponent.total
    ? 'user'
    : finalScores.user.total < finalScores.opponent.total
    ? 'opponent'
    : 'draw';

  // Generate AI feedback
  const userArgs = debate.arguments.filter(a => a.speaker === 'user');
  const aiArgs   = debate.arguments.filter(a => a.speaker === 'ai');
  const feedback = await generateFeedback({
    topic: debate.topic.title,
    userArguments: userArgs,
    aiArguments:   aiArgs,
    userScores:    finalScores.user,
    aiScores:      finalScores.opponent,
  });

  debate.feedback = feedback;
  debate.markModified('arguments');
  await debate.save();

  return debate;
};

/**
 * Abandon a debate mid-session
 */
const abandonDebate = async (debateId) => {
  await Debate.findByIdAndUpdate(debateId, {
    status: 'abandoned',
    completedAt: new Date(),
  });
};

/**
 * Get debate state for reconnection
 */
const getDebateState = async (debateId, userId) => {
  const debate = await Debate.findById(debateId)
    .populate('participants.user', 'username avatar level')
    .lean();

  if (!debate) return null;
  if (debate.participants.user._id.toString() !== userId.toString()) return null;

  return debate;
};

module.exports = {
  createDebate,
  processUserArgument,
  processAITurn,
  concludeDebate,
  abandonDebate,
  getDebateState,
};
