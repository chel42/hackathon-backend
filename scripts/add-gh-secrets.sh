#!/usr/bin/env bash
# Usage: ./scripts/add-gh-secrets.sh
# Requires gh CLI authenticated as a user with repository admin permissions
set -euo pipefail
REPO="CG242/hackathon-backend"

echo "Adding secrets to $REPO (you will be prompted for values)"
read -rp "DATABASE_URL: " DATABASE_URL
gh secret set DATABASE_URL --body "$DATABASE_URL" --repo "$REPO"
read -rp "SUPABASE_URL: " SUPABASE_URL
gh secret set SUPABASE_URL --body "$SUPABASE_URL" --repo "$REPO"
read -rp "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
gh secret set SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY" --repo "$REPO"
read -rp "SUPABASE_SERVICE_ROLE (optional): " SUPABASE_SERVICE_ROLE
if [ -n "$SUPABASE_SERVICE_ROLE" ]; then
  gh secret set SUPABASE_SERVICE_ROLE --body "$SUPABASE_SERVICE_ROLE" --repo "$REPO"
fi
read -rp "FLY_API_TOKEN: " FLY_API_TOKEN
gh secret set FLY_API_TOKEN --body "$FLY_API_TOKEN" --repo "$REPO"
read -rp "FLY_APP_NAME: " FLY_APP_NAME
gh secret set FLY_APP_NAME --body "$FLY_APP_NAME" --repo "$REPO"
echo "All secrets added."