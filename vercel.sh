#!/bin/bash

if [[ $VERCEL_ENV == "preview"  ]] ; then
  pnpm run build
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/PostHog/posthog/releases/download/posthog-cli-v0.0.4/posthog-cli-installer.sh | sh
  /vercel/.posthog/posthog-cli --host https://us.posthog.com sourcemap inject --directory ./.next/static/chunks
  /vercel/.posthog/posthog-cli --host https://us.posthog.com sourcemap upload --directory ./.next/static/chunks
else
  pnpm run build
fi
