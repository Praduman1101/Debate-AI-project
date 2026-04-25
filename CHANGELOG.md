# Changelog

All notable changes to DebateAI are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-04-01

### Added — Backend
- Node.js + Express REST API with JWT authentication
- Socket.io real-time debate engine with per-turn 30-second timer
- Anthropic Claude integration for AI argument generation, scoring (4 dimensions), and coaching feedback
- NLP pipeline using compromise.js + natural + sentiment for tokenization, intent detection, and sentiment analysis
- Combined scoring engine (LLM + NLP adjustments)
- Debate engine managing turn flow, round advancement, and session lifecycle
- PvP matchmaking socket handler with queue, match-on-topic logic, and 60-second timeout
- MongoDB models: User (with stats, XP, badges, level), Debate (with arguments, scores, feedback), Topic
- Full REST API: auth (register, login, profile, password change, delete), debates (history, detail, delete, leaderboard), topics (list, generate, detail), scores (stats, finalize), voice (Whisper proxy), admin (bulk create, update, delete topics)
- Badges system: First Win, 5-Win Streak, Expert Debater, 100 Debates, AI Slayer
- Topic debate counter increment on every new debate
- Winston structured logger with Morgan HTTP request logging
- Startup env var validation (exits with clear error if missing required vars)
- Request ID middleware (X-Request-Id header on every response)
- Custom AppError class with factory helpers
- Reusable validate + asyncHandler middleware
- Docker + docker-compose for local dev
- GitHub Actions CI/CD pipeline (test → build → deploy to Railway)
- OpenAPI 3.0 specification

### Added — Frontend (React Native / Expo)
- 14 screens: Auth, Onboarding, Home, Topic, Mode, Matchmaking, Debate, Results, DebateReview, History, Leaderboard, Profile, Settings, GenerateTopics
- 3 contexts: AuthContext (JWT + isNewUser), DebateContext (live socket state + live score recomputation), ToastContext (success/error/warning/info toasts)
- 9 hooks: useDebateHistory, useDebateTimer, useBadgeUnlock, useHaptics, useLeaderboard, useSound, useTopics, useUserActions, useVoiceInput
- 10 components: ArgumentBubble, ArgumentInput, DailyChallenge, ErrorBoundary, NLPHints, RoundProgressBar, ScoreRadar (SVG spider chart), SkeletonLoader, StatsChart (SVG sparkline), TimerBar
- Real-time NLP hints as user types (client-side, no API call)
- Voice input via expo-av recorder → backend Whisper proxy
- Sound effects via expo-av (preloaded, cached, toggle-able)
- Haptic feedback via expo-haptics (impact/notification/selection)
- Push notification setup via expo-notifications
- Animated onboarding (5 slides, shown once to new users)
- Debate replay (DebateReviewScreen): arguments tab + analysis tab with radar + metric bars
- Score sparkline on ProfileScreen showing trend across last 10 debates
- PvP matchmaking screen with pulsing radar animation and queue position display
- AI topic generator (GenerateTopicsScreen) wired to /api/topics/generate
- Badges unlock toast announcements
- Settings screen with real sound/haptics toggles persisted to AsyncStorage
- Typed API helper functions (AuthAPI, TopicsAPI, DebatesAPI, ScoresAPI, VoiceAPI)
- AppNavigator: initialRouteName routing for new users → Onboarding vs returning users → Main
- Full barrel exports for components, hooks, utils

### Added — Tests (8 suites, 76 tests)
- auth.test.js (8 tests) — register, login, /me, token validation
- topics.test.js (6 tests) — list, filter, search, detail
- userModel.test.js (16 tests) — schema, password hashing, JWT, stats update, level-up
- nlpService.test.js (11 tests) — sentiment, intent, keywords, similarity
- scoringEngine.test.js (7 tests) — averages, totals, edge cases
- debateEngine.test.js (9 tests) — full lifecycle with mocked AI
- debatesAndScores.test.js (13 tests) — history, detail, access control, finalize, badges
- voiceAndServer.test.js (6 tests) — voice route auth, 400/503 responses, health, 404

### Added — Tooling
- SETUP.md — full step-by-step developer guide
- CONTRIBUTING.md — standards, PR checklist, commit format
- scripts/setup.sh — interactive quick-start for new contributors
- scripts/deploy-backend.sh — Railway deployment with pre-deploy test run
- scripts/deploy-frontend.sh — EAS build + submit
- DebateAI.postman_collection.json — all 20 endpoints with auto-token tests
- eas.json — EAS Build profiles (development/preview/production)
- .gitignore files for root, backend, frontend

---

## [Unreleased]

### Planned
- User-vs-User live debate with turn-sharing over shared Socket.io room
- Debate search and filtering in history screen
- Community topic submissions with voting
- Real-time audience mode (watch live debates)
- AI difficulty customization (persona, response length, fact frequency)
- Export debate transcript as PDF
- Streak tracking and streak-based badge system
- Dark/light theme toggle
