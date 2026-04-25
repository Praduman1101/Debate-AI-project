const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema({
  speaker: { type: String, enum: ['user', 'ai', 'opponent'], required: true },
  speakerId: { type: String },
  text: { type: String, required: true },
  round: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  scores: {
    logic:      { type: Number, default: 0 },
    relevance:  { type: Number, default: 0 },
    clarity:    { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    total:      { type: Number, default: 0 },
  },
  nlp: {
    sentiment:  { type: String },
    intent:     { type: String },
    keywords:   [{ type: String }],
    complexity: { type: Number },
  },
  voiceInput: { type: Boolean, default: false },
});

const debateSchema = new mongoose.Schema(
  {
    topic: {
      id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
      title:       { type: String, required: true },
      category:    { type: String },
    },
    mode: {
      type: String,
      enum: ['ai_vs_user', 'user_vs_user', 'practice'],
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'abandoned'],
      default: 'waiting',
    },
    participants: {
      user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for AI mode
    },
    stances: {
      user:     { type: String, enum: ['for', 'against'] },
      opponent: { type: String, enum: ['for', 'against'] },
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate',
    },
    config: {
      totalRounds:    { type: Number, default: 4 },
      turnTimeSeconds: { type: Number, default: 30 },
    },
    currentRound:  { type: Number, default: 1 },
    currentTurn:   { type: String, enum: ['user', 'ai', 'opponent'] },
    arguments:     [argumentSchema],
    scores: {
      user: {
        logic:      { type: Number, default: 0 },
        relevance:  { type: Number, default: 0 },
        clarity:    { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        total:      { type: Number, default: 0 },
      },
      opponent: {
        logic:      { type: Number, default: 0 },
        relevance:  { type: Number, default: 0 },
        clarity:    { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        total:      { type: Number, default: 0 },
      },
    },
    winner: { type: String, enum: ['user', 'opponent', 'draw', null], default: null },
    feedback: {
      strengths:    [{ type: String }],
      weaknesses:   [{ type: String }],
      improvements: [{ type: String }],
      summary:      { type: String },
    },
    roomId: { type: String, unique: true, sparse: true },
    startedAt:   { type: Date },
    completedAt: { type: Date },
    duration:    { type: Number }, // seconds
  },
  { timestamps: true }
);

// Compute cumulative scores from all arguments
debateSchema.methods.recalculateScores = function () {
  const userArgs     = this.arguments.filter(a => a.speaker === 'user');
  const opponentArgs = this.arguments.filter(a => a.speaker === 'ai' || a.speaker === 'opponent');

  const avg = (arr, key) =>
    arr.length ? Math.round(arr.reduce((s, a) => s + (a.scores[key] || 0), 0) / arr.length) : 0;

  ['user', 'opponent'].forEach((role, i) => {
    const args = role === 'user' ? userArgs : opponentArgs;
    this.scores[role] = {
      logic:      avg(args, 'logic'),
      relevance:  avg(args, 'relevance'),
      clarity:    avg(args, 'clarity'),
      confidence: avg(args, 'confidence'),
      total:      Math.round((avg(args, 'logic') + avg(args, 'relevance') + avg(args, 'clarity') + avg(args, 'confidence')) / 4),
    };
  });
};

module.exports = mongoose.model('Debate', debateSchema);
