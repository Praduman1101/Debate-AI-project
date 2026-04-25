# Contributing to DebateAI

Thank you for your interest in contributing! This guide covers everything you need to know.

---

## Development Setup

See [SETUP.md](./SETUP.md) for the full local environment setup.

**Quick start:**
```bash
git clone https://github.com/yourname/debate-ai.git
cd debate-ai/backend && npm install && cp .env.example .env && node seed.js && npm run dev
cd ../frontend && npm install && cp .env.example .env && npx expo start
```

---

## Project Structure

```
backend/                    Node.js + Express + Socket.io
  services/aiService.js     → Anthropic Claude API calls
  services/nlpService.js    → NLP analysis (compromise, sentiment)
  services/scoringEngine.js → Scoring pipeline
  services/debateEngine.js  → Turn management
  socket/debateSocket.js    → Live debate events
  socket/matchmakingSocket.js → PvP matchmaking

frontend/src/
  screens/    → 14 screens
  components/ → 9 reusable components
  hooks/      → 7 custom hooks
  context/    → Auth + Debate + Toast providers
  utils/      → Theme, helpers, constants
```

---

## Coding Standards

### JavaScript / React Native
- Functional components with hooks only
- `StyleSheet.create()` for all styles — no inline objects
- Prefix screen components with capital letter, hooks with `use`
- Always handle loading and error states

### Backend
- Async/await with try-catch on all route handlers
- Validate input with express-validator before processing
- Use the logger (`config/logger.js`) instead of `console.log` in production code

---

## Adding a New Screen

1. Create `frontend/src/screens/YourScreen.js`
2. Register it in `AppNavigator.js`
3. Add any needed route params to the Stack.Screen definition
4. If it needs auth, the navigator already protects all authenticated routes

## Adding a New API Endpoint

1. Add the route to the appropriate file in `backend/routes/`
2. Add auth middleware (`protect`) if needed
3. Add the endpoint to `utils/constants.js` in the `API_ENDPOINTS` object
4. Add it to the Postman collection (`DebateAI.postman_collection.json`)
5. Write a test in `backend/__tests__/`

## Adding a New Hook

1. Create `frontend/src/hooks/useYourHook.js`
2. Export it from `frontend/src/hooks/index.js`
3. Follow the pattern: return state + actions, handle errors internally

---

## Testing

### Backend
```bash
cd backend
npm test              # all tests
npm run test:cov      # with coverage
npx jest __tests__/yourFile.test.js  # single file
```

Test files live in `backend/__tests__/`. Use `mongodb-memory-server` for DB tests. Mock AI service calls with `jest.mock('../services/aiService', () => ({ ... }))`.

### Frontend
```bash
cd frontend
npx jest src/utils/helpers.test.js
```

---

## Pull Request Checklist

Before submitting a PR:

- [ ] `npm test` passes in `backend/`
- [ ] No new TypeErrors / PropTypes warnings in the Expo console
- [ ] New screens are registered in `AppNavigator.js`
- [ ] New API endpoints are documented in `DebateAI.postman_collection.json`
- [ ] New env vars are added to `.env.example` with comments
- [ ] `SETUP.md` is updated if setup steps change

---

## Reporting Bugs

Open a GitHub Issue with:
1. Steps to reproduce
2. Expected vs actual behavior
3. Device/OS and app version
4. Console output or screenshots if relevant

---

## Commit Message Format

```
type(scope): short description

feat(debate): add voice input with Whisper transcription
fix(auth): handle token expiry on app resume
test(scoring): add edge cases for zero-argument debates
docs(setup): add Android emulator IP note
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`
