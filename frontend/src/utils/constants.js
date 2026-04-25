// ============================================================
// DebateAI — App-Wide Constants
// ============================================================

// ── API / Socket events ────────────────────────────────────
export const SOCKET_EVENTS = {
  // Client → Server
  DEBATE_START:      'debate:start',
  DEBATE_RECONNECT:  'debate:reconnect',
  DEBATE_ABANDON:    'debate:abandon',
  ARGUMENT_SUBMIT:   'argument:submit',
  MATCHMAKING_JOIN:  'matchmaking:join',
  MATCHMAKING_LEAVE: 'matchmaking:leave',

  // Server → Client
  DEBATE_STARTED:    'debate:started',
  DEBATE_STATE:      'debate:state',
  DEBATE_COMPLETE:   'debate:complete',
  DEBATE_ABANDONED:  'debate:abandoned',
  ARGUMENT_SCORED:   'argument:scored',
  AI_THINKING:       'ai:thinking',
  AI_ARGUMENT:       'ai:argument',
  TIMER_UPDATE:      'timer:update',
  TURN_TIMEOUT:      'turn:timeout',
  MATCHED:           'matchmaking:matched',
  WAITING:           'matchmaking:waiting',
  MATCH_TIMEOUT:     'matchmaking:timeout',
  ERROR:             'error',
};

// ── Debate config ──────────────────────────────────────────
export const DEBATE_CONFIG = {
  DEFAULT_ROUNDS:      4,
  TURN_TIME_SECONDS:   30,
  MIN_ROUNDS:          2,
  MAX_ROUNDS:          8,
  MAX_ARGUMENT_CHARS:  500,
  MIN_ARGUMENT_WORDS:  5,
  MATCHMAKING_TIMEOUT: 60000,  // 1 minute
};

// ── Scoring ────────────────────────────────────────────────
export const SCORE_DIMENSIONS = ['logic', 'relevance', 'clarity', 'confidence'];

export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD:      70,
  AVERAGE:   55,
  POOR:      40,
};

// ── Gamification ───────────────────────────────────────────
export const XP_REWARDS = {
  WIN:            100,
  LOSS:            40,
  DRAW:            60,
  PERFECT_SCORE:  200,
  FIRST_DEBATE:    50,
};

export const LEVELS = {
  XP_PER_LEVEL: 500,
  MAX_LEVEL:    100,
};

// ── Debate modes ───────────────────────────────────────────
export const DEBATE_MODES = {
  AI_VS_USER:   'ai_vs_user',
  USER_VS_USER: 'user_vs_user',
  PRACTICE:     'practice',
};

export const DIFFICULTIES = {
  BEGINNER:     'beginner',
  INTERMEDIATE: 'intermediate',
  EXPERT:       'expert',
};

export const STANCES = {
  FOR:     'for',
  AGAINST: 'against',
};

// ── Categories ─────────────────────────────────────────────
export const TOPIC_CATEGORIES = [
  'technology', 'climate', 'politics',
  'education',  'economy', 'science', 'health', 'society',
];

// ── UI / pagination ────────────────────────────────────────
export const PAGINATION = {
  DEBATES_PER_PAGE:    10,
  TOPICS_PER_PAGE:     30,
  LEADERBOARD_LIMIT:   20,
};

// ── AsyncStorage keys ──────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN:        'debate_token',
  ONBOARDING_DONE:   'onboarding_done',
  SOUND_ENABLED:     'sound_enabled',
  HAPTICS_ENABLED:   'haptics_enabled',
};

// ── API endpoints ──────────────────────────────────────────
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER:        '/auth/register',
    LOGIN:           '/auth/login',
    ME:              '/auth/me',
    PROFILE:         '/auth/profile',
    PASSWORD:        '/auth/password',
    ACCOUNT:         '/auth/account',
  },
  TOPICS: {
    LIST:            '/topics',
    GENERATE:        '/topics/generate',
    DETAIL:          (id) => `/topics/${id}`,
  },
  DEBATES: {
    LIST:            '/debates',
    DETAIL:          (id) => `/debates/${id}`,
    LEADERBOARD:     '/debates/stats/leaderboard',
  },
  SCORES: {
    ME:              '/scores/me',
    FINALIZE:        (id) => `/scores/finalize/${id}`,
  },
  VOICE: {
    TRANSCRIBE: '/voice/transcribe',
  },
  ADMIN: {
    TOPICS_BULK:      '/admin/topics/bulk',
    TOPIC_UPDATE:     (id) => `/admin/topics/${id}`,
    TOPIC_DELETE:     (id) => `/admin/topics/${id}`,
    TOPIC_INCREMENT:  (id) => `/admin/topics/${id}/increment`,
  },
};
