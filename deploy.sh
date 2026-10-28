#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="/home/admin_gu/codenexus/Exam-Proctar"
BACKEND="$PROJECT/backend"
FRONTEND="$PROJECT/frontend"
BRANCH="main"
BACKEND_SERVICE="codenexus-backend.service"
FRONTEND_SERVICE="codenexus-frontend.service"

cd "$PROJECT"

die() {
    echo "ERROR: $*" >&2
    exit 1
}

need() {
    command -v "$1" >/dev/null 2>&1 || die "Required command missing: $1"
}

need git
need npm
need sudo

[[ -f "$BACKEND/.env" ]] || die "Backend .env is missing"
[[ -f "$BACKEND/package.json" ]] || die "Backend package.json is missing"
[[ -f "$FRONTEND/package.json" ]] || die "Frontend package.json is missing"

git diff --quiet && git diff --cached --quiet ||
    die "Tracked local changes detected. Commit or stash them before deploying."

[[ -z "$(git ls-files --others --exclude-standard)" ]] ||
    die "Untracked files detected. Review them before deploying."

[[ "$(git branch --show-current)" == "$BRANCH" ]] ||
    die "Expected branch $BRANCH"

sudo -v

sudo systemctl cat "$BACKEND_SERVICE" >/dev/null ||
    die "Backend service not found: $BACKEND_SERVICE"

sudo systemctl cat "$FRONTEND_SERVICE" >/dev/null ||
    die "Frontend service not found: $FRONTEND_SERVICE"

echo "Fetching latest GitHub code..."
git fetch origin "$BRANCH"

git merge-base --is-ancestor HEAD "origin/$BRANCH" ||
    die "Local branch diverged from origin/$BRANCH; refusing automatic deployment."

git merge --ff-only "origin/$BRANCH"

echo "Installing backend dependencies..."
cd "$BACKEND"
npm ci
if node -e "process.exit(require('./package.json').dependencies?.['@prisma/client'] ? 0 : 1)"; then
    npx prisma generate
fi

echo "Installing frontend dependencies and building..."
cd "$FRONTEND"
npm ci
npm run build

echo "Restarting Exam-Proctar services..."
sudo systemctl restart "$BACKEND_SERVICE"
sudo systemctl restart "$FRONTEND_SERVICE"

sudo systemctl is-active --quiet "$BACKEND_SERVICE" ||
    die "Backend service failed to become active"

sudo systemctl is-active --quiet "$FRONTEND_SERVICE" ||
    die "Frontend service failed to become active"

echo
echo "Deployment completed successfully."
sudo systemctl --no-pager --full status "$BACKEND_SERVICE" "$FRONTEND_SERVICE"
