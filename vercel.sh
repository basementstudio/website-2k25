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

# Since Next 16.3, Vercel's build adapter relocates the client output into
# .vercel/output during `next build`, so post-build steps no longer find
# ./.next/static — sourcemap upload has to happen inside the build instead.
pnpm run build
