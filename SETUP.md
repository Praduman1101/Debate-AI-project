# DebateAI — Developer Setup Guide

Everything you need to get the project running locally in under 10 minutes.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7+ | [mongodb.com](https://mongodb.com) or use Atlas |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI (optional) | latest | `npm install -g eas-cli` |

You also need:
- **Anthropic API key** → [console.anthropic.com](https://console.anthropic.com) (required)
- **OpenAI API key** → [platform.openai.com](https://platform.openai.com) (optional, voice input only)

---

## Step 1 — Clone and navigate

```bash
git clone https://github.com/yourname/debate-ai.git
cd debate-ai
```

---

## Step 2 — Backend setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGODB_URI=mongodb://localhost:27017/debate_ai
JWT_SECRET=any-long-random-string-32-chars-minimum
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here          # optional
```

```bash
# Seed 15 starter debate topics
node seed.js

# Start the dev server (with auto-reload)
npm run dev
```

✅ Backend is running at `http://localhost:5000`
✅ Health check: `curl http://localhost:5000/health`

---

## Step 3 — Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

The default `.env` works for local development:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

> **Android note:** Replace `localhost` with your machine's local IP address (e.g. `192.168.1.5`) so the Android emulator or device can reach your backend.

```bash
# Start Expo
npx expo start
```

Then press:
- `i` → iOS Simulator (Mac only)
- `a` → Android Emulator
- `w` → Web browser
- Scan QR code with **Expo Go** app on your phone

---

## Step 4 — Run the tests

```bash
cd backend
npm test              # runs all 4 test suites
npm run test:cov      # with coverage report
```

Expected output:
```
✅ auth.test.js       — 8 tests passed
✅ topics.test.js     — 6 tests passed
✅ nlpService.test.js — 11 tests passed
✅ scoringEngine.test.js — 7 tests passed
```

---

## Step 5 — Import the Postman collection

1. Open Postman
2. **Import** → select `DebateAI.postman_collection.json`
3. Set the `token` variable via the **Register** or **Login** request (auto-captured by test script)
4. All 15 endpoints are ready to test

---

## Option: Docker (skips Steps 2-3)

```bash
# From project root
cp backend/.env.example backend/.env
# Edit backend/.env — set ANTHROPIC_API_KEY

docker compose up -d
docker compose exec backend node seed.js

# Then start the frontend normally
cd frontend && npx expo start
```

View the MongoDB database in your browser:
```bash
docker compose --profile debug up
# Open http://localhost:8081  (admin / admin123)
```

---

## Project structure quick reference

```
debate-ai/
├── backend/
│   ├── server.js          ← Express + Socket.io entry point
│   ├── seed.js            ← Run once to populate topics
│   ├── routes/            ← REST API endpoints
│   ├── services/          ← Business logic (AI, NLP, scoring)
│   ├── socket/            ← WebSocket handlers (debate + matchmaking)
│   └── __tests__/         ← Jest test suites
└── frontend/
    ├── App.js             ← Root (ErrorBoundary + providers)
    ├── src/screens/       ← 12 screens
    ├── src/components/    ← 7 reusable components
    ├── src/hooks/         ← 5 custom hooks
    ├── src/context/       ← Auth + Debate + Toast contexts
    └── src/utils/         ← Theme tokens + helpers
```

---

## Common issues

### "Cannot connect to backend"
- Make sure the backend is running: `curl http://localhost:5000/health`
- On Android emulator, use your machine's IP instead of `localhost`
- Check `EXPO_PUBLIC_API_URL` in `frontend/.env`

### "No topics showing"
- Run `node seed.js` in the backend directory
- Check MongoDB is running: `mongosh --eval "db.runCommand({ping:1})"`

### "AI not responding / scoring fails"
- Verify `ANTHROPIC_API_KEY` is set in `backend/.env`
- Check the key has credits at [console.anthropic.com](https://console.anthropic.com)

### "Voice input not working"
- Add `OPENAI_API_KEY` to `backend/.env`
- Microphone permission must be granted to the app
- Voice STT requires the `/api/voice/transcribe` endpoint to be reachable

### "WebSocket disconnects immediately"
- Ensure `EXPO_PUBLIC_SOCKET_URL` points to the correct server
- The JWT token must be valid — try re-logging in

---

## Environment summary

| Variable | Where | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | backend `.env` | Database connection |
| `JWT_SECRET` | backend `.env` | Token signing |
| `ANTHROPIC_API_KEY` | backend `.env` | AI debates + scoring |
| `OPENAI_API_KEY` | backend `.env` | Voice transcription (optional) |
| `EXPO_PUBLIC_API_URL` | frontend `.env` | REST API base URL |
| `EXPO_PUBLIC_SOCKET_URL` | frontend `.env` | WebSocket server URL |

---

## Deployment

### Backend → Railway

```bash
npm install -g @railway/cli
railway login
cd backend
railway init          # link to a project
railway up            # deploy
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set MONGODB_URI=mongodb+srv://...
railway variables set JWT_SECRET=your-secret
```

### Frontend → Expo EAS

```bash
cd frontend
eas login
eas build --platform all         # iOS + Android
eas submit --platform all        # App Store + Play Store
```

---

## Architecture overview

```
React Native (Expo)
      │
      │  REST API (axios)
      │  WebSocket (socket.io-client)
      ▼
Node.js + Express + Socket.io
      │
      ├── JWT Auth
      ├── AI Service ──────► Anthropic Claude API
      ├── NLP Service (compromise + sentiment)
      ├── Scoring Engine
      ├── Debate Engine
      ├── Matchmaking Queue
      │
      ▼
MongoDB (Mongoose)
  ├── users
  ├── debates
  └── topics
```
