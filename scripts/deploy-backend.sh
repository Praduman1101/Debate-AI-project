#!/usr/bin/env bash
# DebateAI — Deploy Backend to Railway
# Usage: bash scripts/deploy-backend.sh
#
# Prerequisites:
#   npm install -g @railway/cli
#   railway login

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

command -v railway >/dev/null || error "Railway CLI not found. Run: npm install -g @railway/cli"

info "Running tests before deploy..."
cd "$(dirname "$0")/../backend"
npm test || error "Tests failed — deploy aborted"

info "Deploying to Railway..."
railway up --service debate-ai-backend

info "Setting environment variables..."
# Only set if not already configured
railway variables set \
  NODE_ENV=production \
  --service debate-ai-backend || warn "Some env vars may already be set"

echo ""
info "✅ Backend deployed!"
echo ""
echo "  Don't forget to set:"
echo "    railway variables set ANTHROPIC_API_KEY=sk-ant-..."
echo "    railway variables set MONGODB_URI=mongodb+srv://..."
echo "    railway variables set JWT_SECRET=your-secret"
echo ""
echo "  Check deployment: railway status"
echo "  View logs:        railway logs"
echo "  Open in browser:  railway open"
