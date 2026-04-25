const express = require('express');
const router = express.Router();
const Debate = require('../models/Debate');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/debates — user's debate history
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { 'participants.user': req.user._id };
    if (status) query.status = status;

    const debates = await Debate.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-arguments')
      .lean();

    const total = await Debate.countDocuments(query);

    res.json({ success: true, debates, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/debates/:id — full debate detail
router.get('/:id', protect, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('participants.user', 'username avatar level');

    if (!debate) return res.status(404).json({ error: 'Debate not found' });

    if (debate.participants.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, debate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/debates/:id — delete a completed debate from history
router.delete('/:id', protect, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ error: 'Debate not found' });
    if (debate.participants.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await debate.deleteOne();
    res.json({ success: true, message: 'Debate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/debates/leaderboard — top users by win rate
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ 'stats.totalDebates': { $gte: 3 } })
      .select('username avatar stats level')
      .sort({ 'stats.wins': -1, 'stats.avgScore': -1 })
      .limit(20)
      .lean();

    res.json({ success: true, leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
