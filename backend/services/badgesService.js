/**
 * Badges Service
 * Awards badges to users when they reach milestones.
 * Called after each debate is finalized.
 *
 * Badge definitions:
 *   first_win    — Won first debate
 *   streak_5     — Won 5 debates in a row (approximate via total wins)
 *   expert       — Average score >= 85 over 5+ debates
 *   centurion    — Completed 100 debates
 *   ai_slayer    — Beaten AI on Expert difficulty
 */

const User   = require('../models/User');
const Debate = require('../models/Debate');

const BADGE_CHECKS = [
  {
    id:    'first_win',
    label: 'First Win',
    check: (stats) => stats.wins >= 1,
  },
  {
    id:    'streak_5',
    label: '5-Win Streak',
    check: (stats) => stats.wins >= 5,
  },
  {
    id:    'expert',
    label: 'Expert Debater',
    check: (stats) => stats.totalDebates >= 5 && stats.avgScore >= 85,
  },
  {
    id:    'centurion',
    label: '100 Debates',
    check: (stats) => stats.totalDebates >= 100,
  },
];

/**
 * Check and award any newly earned badges after a debate.
 * Returns array of newly awarded badge IDs.
 */
const checkAndAwardBadges = async (userId, debate) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const newBadges = [];

  // Check standard milestone badges
  for (const badge of BADGE_CHECKS) {
    if (!user.badges.includes(badge.id) && badge.check(user.stats)) {
      user.badges.push(badge.id);
      newBadges.push(badge.id);
    }
  }

  // Check AI Slayer: beat AI on expert difficulty
  if (
    !user.badges.includes('ai_slayer') &&
    debate?.mode === 'ai_vs_user' &&
    debate?.difficulty === 'expert' &&
    debate?.winner === 'user'
  ) {
    user.badges.push('ai_slayer');
    newBadges.push('ai_slayer');
  }

  if (newBadges.length > 0) {
    await user.save();
  }

  return newBadges;
};

/**
 * Get all badges a user has earned with metadata
 */
const getUserBadges = (badgeIds = []) => {
  const ALL_BADGES = {
    first_win:  { icon: '🏆', label: 'First Win',       desc: 'Won your first debate' },
    streak_5:   { icon: '🔥', label: '5-Win Streak',    desc: 'Won 5 debates' },
    expert:     { icon: '🎓', label: 'Expert Debater',  desc: 'Avg score 85+ over 5 debates' },
    centurion:  { icon: '💯', label: '100 Debates',     desc: 'Completed 100 debates' },
    ai_slayer:  { icon: '🤖', label: 'AI Slayer',       desc: 'Beat AI on Expert difficulty' },
  };
  return badgeIds.map(id => ({ id, ...ALL_BADGES[id] })).filter(b => b.label);
};

module.exports = { checkAndAwardBadges, getUserBadges };
