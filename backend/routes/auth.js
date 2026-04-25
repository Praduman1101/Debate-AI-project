const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const User   = require('../models/User');
const Debate = require('../models/Debate');
const { protect } = require('../middleware/auth');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:      user._id,
      username: user.username,
      email:    user.email,
      stats:    user.stats,
      level:    user.level,
      xp:       user.xp,
      badges:   user.badges,
    },
  });
};

// POST /api/auth/register
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { username, email, password } = req.body;
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        const field = existing.email === email ? 'Email' : 'Username';
        return res.status(400).json({ error: `${field} already in use` });
      }
      const user = await User.create({ username, email, password });
      sendToken(user, 201, res);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      sendToken(user, 200, res);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', protect,
  [body('username').optional().trim().isLength({ min: 3, max: 30 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { username, avatar } = req.body;
      const updates = {};
      if (username) {
        const taken = await User.findOne({ username, _id: { $ne: req.user._id } });
        if (taken) return res.status(400).json({ error: 'Username already taken' });
        updates.username = username;
      }
      if (avatar) updates.avatar = avatar;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ success: true, user });
    } catch (err) { res.status(400).json({ error: err.message }); }
  }
);

// PUT /api/auth/password
router.put('/password', protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      user.password = newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// DELETE /api/auth/account
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password confirmation required' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    await Debate.deleteMany({ 'participants.user': req.user._id });
    await user.deleteOne();
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
