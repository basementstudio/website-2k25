#!/bin/bash
set -e

# Extract Sanity Studio manifest so the Sanity Dashboard can read it
# from /studio/static/create-manifest.json (served by Next.js public/).
pnpm exec sanity manifest extract --path public/studio/static

# Deploy schema to Sanity (only when token is present — required for Dashboard).
# Configure SANITY_AUTH_TOKEN in Vercel project env vars.
if [[ -n "$SANITY_AUTH_TOKEN" ]] ; then
  pnpm exec sanity schema deploy
else
  echo "Skipping 'sanity schema deploy' — SANITY_AUTH_TOKEN is not set."
fi

if [[ $VERCEL_ENV == "production"  ]] ; then
  pnpm run build
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/PostHog/posthog/releases/download/posthog-cli-v0.0.4/posthog-cli-installer.sh | sh
  /vercel/.posthog/posthog-cli --host https://us.posthog.com sourcemap inject --directory ./.next/static/chunks
  /vercel/.posthog/posthog-cli --host https://us.posthog.com sourcemap upload --directory ./.next/static/chunks
else
  pnpm run build
fi
