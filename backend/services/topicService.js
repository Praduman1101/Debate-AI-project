const Topic = require('../models/Topic');

/**
 * Increments the totalDebates counter for a topic.
 * Called silently — never throws, errors are swallowed.
 */
const incrementTopicDebateCount = async (topicId) => {
  if (!topicId) return;
  try {
    await Topic.findByIdAndUpdate(topicId, { $inc: { totalDebates: 1 } });
  } catch (_) {
    // Silent — this is a best-effort counter
  }
};

module.exports = { incrementTopicDebateCount };
