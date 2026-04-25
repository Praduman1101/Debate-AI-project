#!/usr/bin/env bash
# DebateAI — Developer Quick-Start Setup Script
# Usage: bash scripts/setup.sh
# Requires: Node 18+, npm, MongoDB (or Docker)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
section() { echo -e "\n${GREEN}━━━ $1 ━━━${NC}"; }

# ── Prerequisite checks ───────────────────────────────────────────────────
section "Checking prerequisites"

command -v node >/dev/null || error "Node.js not found. Install from https://nodejs.org"
command -v npm  >/dev/null || error "npm not found."

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  error "Node.js 18+ required. Current: $(node --version)"
fi
info "Node.js $(node --version) ✓"

# Check Expo CLI
if ! command -v expo &>/dev/null && ! npx expo --version &>/dev/null 2>&1; then
  warn "Expo CLI not found globally. Installing..."
  npm install -g expo-cli
fi
info "Expo CLI ✓"

# Check MongoDB
if command -v mongod &>/dev/null; then
  info "MongoDB found locally ✓"
  MONGO_URI="mongodb://localhost:27017/debate_ai"
elif command -v docker &>/dev/null; then
  warn "MongoDB not found locally. Will use Docker..."
  MONGO_URI="mongodb://localhost:27017/debate_ai"
  USE_DOCKER=true
else
  warn "Neither MongoDB nor Docker found."
  warn "You can still use MongoDB Atlas — enter the connection string below."
  MONGO_URI=""
fi

# ── API key collection ────────────────────────────────────────────────────
section "API Keys"

echo ""
echo "You need an Anthropic API key to run AI debates."
echo "Get one free at: https://console.anthropic.com"
echo ""

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  read -rp "  Anthropic API key (sk-ant-...): " ANTHROPIC_API_KEY
fi

read -rp "  OpenAI API key for voice input (optional, press Enter to skip): " OPENAI_API_KEY

if [ -z "$MONGO_URI" ]; then
  read -rp "  MongoDB URI (e.g. mongodb+srv://...): " MONGO_URI
fi

# ── Backend setup ─────────────────────────────────────────────────────────
section "Backend setup"

cd "$(dirname "$0")/../backend" || error "Could not find backend directory"

info "Installing backend dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  # Populate .env
  sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGO_URI|" .env
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "please_set_a_strong_random_secret_here")|" .env
  sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY|" .env
  if [ -n "$OPENAI_API_KEY" ]; then
    sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" .env
  fi
  info "Created backend/.env ✓"
else
  warn "backend/.env already exists — skipping (edit manually if needed)"
fi

# Start MongoDB via Docker if needed
if [ "${USE_DOCKER:-false}" = "true" ]; then
  info "Starting MongoDB via Docker..."
  docker run -d --name debate-ai-mongo -p 27017:27017 mongo:7 >/dev/null 2>&1 || \
    info "MongoDB container may already be running"
fi

info "Seeding database with starter topics..."
node seed.js

info "Running backend tests..."
npm test || warn "Some tests failed — check the output above"

# ── Frontend setup ────────────────────────────────────────────────────────
section "Frontend setup"

cd "../frontend" || error "Could not find frontend directory"

info "Installing frontend dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  info "Created frontend/.env ✓"
else
  warn "frontend/.env already exists — skipping"
fi

# ── Done ──────────────────────────────────────────────────────────────────
section "Setup complete!"

echo ""
echo "  1. Start the backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Start the frontend (new terminal):"
echo "     cd frontend && npx expo start"
echo ""
echo "  3. Import the Postman collection:"
echo "     DebateAI.postman_collection.json"
echo ""
echo "  Read SETUP.md for detailed instructions."
echo ""
