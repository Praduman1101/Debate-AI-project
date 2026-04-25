const express = require('express');
const router  = express.Router();
const Debate  = require('../models/Debate');
const User    = require('../models/User');
const { protect }             = require('../middleware/auth');
const { checkAndAwardBadges } = require('../services/badgesService');

// GET /api/scores/me — personal stats + recent debates
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('stats level xp badges username');

    const recentDebates = await Debate.find({
      'participants.user': req.user._id,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select('topic scores winner completedAt duration mode difficulty status')
      .lean();

    res.json({
      success: true,
      stats:         user.stats,
      level:         user.level,
      xp:            user.xp,
      badges:        user.badges,
      recentDebates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores/finalize/:debateId — update stats + award badges
router.post('/finalize/:debateId', protect, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.debateId);
    if (!debate || debate.status !== 'completed') {
      return res.status(400).json({ error: 'Debate not completed' });
    }
    if (debate.participants.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.user._id);
    await user.updateStats({
      won:        debate.winner === 'user',
      totalScore: debate.scores.user.total,
      logic:      debate.scores.user.logic,
      clarity:    debate.scores.user.clarity,
      confidence: debate.scores.user.confidence,
    });

    // Check for newly earned badges
    const newBadges = await checkAndAwardBadges(req.user._id, debate);

    // Refresh user after potential badge update
    const updated = await User.findById(req.user._id).select('stats level xp badges');

    res.json({
      success:    true,
      stats:      updated.stats,
      level:      updated.level,
      xp:         updated.xp,
      badges:     updated.badges,
      newBadges,              // client shows badge unlock notification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
