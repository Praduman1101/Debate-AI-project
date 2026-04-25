const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['technology', 'climate', 'politics', 'education', 'economy', 'science', 'society', 'health'],
      required: true,
    },
    description: { type: String },
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate',
    },
    totalDebates: { type: Number, default: 0 },
    trending:     { type: Boolean, default: false },
    featured:     { type: Boolean, default: false },
    aiContext: { type: String }, // Background info fed to AI for this topic
  },
  { timestamps: true }
);

topicSchema.index({ category: 1 });
topicSchema.index({ trending: -1, totalDebates: -1 });

module.exports = mongoose.model('Topic', topicSchema);
