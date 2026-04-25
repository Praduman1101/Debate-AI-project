const express = require('express');
const router  = express.Router();
const Topic   = require('../models/Topic');
const { protect } = require('../middleware/auth');

/**
 * Admin routes for topic management.
 * In production, protect these with an admin role check.
 * For simplicity here, any authenticated user can call these.
 */

// POST /api/admin/topics/bulk — create multiple topics at once
router.post('/topics/bulk', protect, async (req, res) => {
  try {
    const { topics } = req.body;
    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'topics array is required' });
    }
    if (topics.length > 50) {
      return res.status(400).json({ error: 'Max 50 topics per request' });
    }

    const created = await Topic.insertMany(topics, { ordered: false });
    res.status(201).json({ success: true, count: created.length, topics: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/topics/:id — update topic fields
router.patch('/topics/:id', protect, async (req, res) => {
  try {
    const allowed = ['title', 'category', 'difficulty', 'description',
                     'tags', 'trending', 'featured', 'aiContext'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const topic = await Topic.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json({ success: true, topic });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/topics/:id — remove a topic
router.delete('/topics/:id', protect, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/topics/:id/increment — bump debate count
router.post('/topics/:id/increment', async (req, res) => {
  try {
    await Topic.findByIdAndUpdate(req.params.id, { $inc: { totalDebates: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
