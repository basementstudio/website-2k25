import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // Error tracking only — no tracing, no session replay.
  tracesSampleRate: 0
})
