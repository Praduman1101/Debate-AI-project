const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const { protect } = require('../middleware/auth');
const { generateTopics } = require('../services/aiService');

// GET /api/topics
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, featured, limit = 20 } = req.query;
    const query = {};

    if (category)   query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (featured)   query.featured = true;
    if (search)     query.title = { $regex: search, $options: 'i' };

    const topics = await Topic.find(query)
      .sort({ trending: -1, totalDebates: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/topics/generate — AI-generate new topics
router.get('/generate', protect, async (req, res) => {
  try {
    const { category = 'technology', count = 5 } = req.query;
    const topics = await generateTopics(category, parseInt(count));
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/topics/:id
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
