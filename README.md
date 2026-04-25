# ⚡ DebateAI — Full-Stack AI Debate System

React Native + Node.js + Socket.io + Claude AI — 95 files, production-ready.

## Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env  # set MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY
node seed.js && npm run dev

# Frontend
cd frontend && npm install
cp .env.example .env
npx expo start
```

See **SETUP.md** for the full developer guide.

## Tests — 67 tests, 8 suites

```bash
cd backend && npm test
```

## 14 Screens
Auth → Onboarding → Home → Topic → Mode → Matchmaking → Debate → Results → DebateReview → History → Leaderboard → Profile → Settings → GenerateTopics

## 9 Custom Hooks
useDebateHistory · useDebateTimer · useHaptics · useLeaderboard · useSound · useTopics · useUserActions · useVoiceInput · useBadgeUnlock

## 10 Components
ArgumentBubble · ArgumentInput · DailyChallenge · ErrorBoundary · NLPHints · RoundProgressBar · ScoreRadar · SkeletonLoader · StatsChart · TimerBar

## Stack
React Native · Expo · Node.js · Express · Socket.io · MongoDB · Claude AI · Whisper · JWT · expo-haptics · expo-av · expo-notifications · Docker · GitHub Actions · EAS
