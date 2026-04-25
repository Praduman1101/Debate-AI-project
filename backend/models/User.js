const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: { type: String, default: '' },
    stats: {
      totalDebates:  { type: Number, default: 0 },
      wins:          { type: Number, default: 0 },
      losses:        { type: Number, default: 0 },
      avgScore:      { type: Number, default: 0 },
      avgLogic:      { type: Number, default: 0 },
      avgClarity:    { type: Number, default: 0 },
      avgConfidence: { type: Number, default: 0 },
    },
    badges: [{ type: String }],
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT
userSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Update stats after a debate
userSchema.methods.updateStats = async function (debateResult) {
  const s = this.stats;
  s.totalDebates += 1;
  if (debateResult.won) s.wins += 1;
  else s.losses += 1;

  const n = s.totalDebates;
  s.avgScore      = Math.round((s.avgScore * (n - 1) + debateResult.totalScore) / n);
  s.avgLogic      = Math.round((s.avgLogic * (n - 1) + debateResult.logic) / n);
  s.avgClarity    = Math.round((s.avgClarity * (n - 1) + debateResult.clarity) / n);
  s.avgConfidence = Math.round((s.avgConfidence * (n - 1) + debateResult.confidence) / n);

  // XP and level
  this.xp += debateResult.won ? 100 : 40;
  this.level = Math.floor(this.xp / 500) + 1;

  await this.save();
};

module.exports = mongoose.model('User', userSchema);
