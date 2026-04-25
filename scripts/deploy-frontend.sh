#!/usr/bin/env bash
# DebateAI — Build and Submit Frontend via Expo EAS
# Usage: bash scripts/deploy-frontend.sh [--platform ios|android|all] [--profile production|preview]

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

PLATFORM="${1:-all}"
PROFILE="${2:-production}"

command -v eas >/dev/null || error "EAS CLI not found. Run: npm install -g eas-cli && eas login"

cd "$(dirname "$0")/../frontend" || error "Could not find frontend directory"

info "Building for platform: $PLATFORM, profile: $PROFILE"
echo ""

# Validate .env
if [ ! -f .env ]; then
  error "frontend/.env not found. Copy .env.example and fill in production API URLs."
fi

# Check production URL is set
if grep -q "localhost" .env; then
  warn "frontend/.env still contains localhost — update to production URLs before submitting!"
  read -rp "Continue anyway? (y/N): " confirm
  [ "$confirm" = "y" ] || exit 1
fi

# Build
info "Starting EAS build..."
eas build --platform "$PLATFORM" --profile "$PROFILE" --non-interactive

# Submit to stores
read -rp "Submit to app stores now? (y/N): " do_submit
if [ "$do_submit" = "y" ]; then
  info "Submitting to stores..."
  eas submit --platform "$PLATFORM" --latest --non-interactive
  info "✅ Submitted! Check status at https://expo.dev"
else
  info "Build complete. Run 'eas submit' when ready to publish."
fi

echo ""
info "✅ Deploy script complete"
echo ""
echo "  Check build status: eas build:list"
echo "  Download build:     eas build:view"
