const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const FormData = require('form-data');
const axios    = require('axios');
const { protect } = require('../middleware/auth');

// Store audio in memory (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported audio format'));
  },
});

/**
 * POST /api/voice/transcribe
 * Accepts audio file, forwards to OpenAI Whisper, returns transcript.
 *
 * Note: Requires OPENAI_API_KEY in your backend .env
 * The key stays server-side — never exposed to the mobile client.
 */
router.post('/transcribe', protect, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(503).json({ error: 'Voice transcription not configured on this server' });
  }

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename:    'audio.m4a',
      contentType: req.file.mimetype,
    });
    form.append('model',    'whisper-1');
    form.append('language', 'en');
    form.append('prompt',   'Debate argument about ' + (req.body.topic || 'a topic'));

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    const transcript = response.data?.text?.trim() || '';
    res.json({ success: true, transcript });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ error: `Transcription failed: ${msg}` });
  }
});

module.exports = router;
