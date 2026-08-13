import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production"
  // Error tracking only. `tracesSampleRate` is omitted, not zeroed: the SDK
  // treats any non-nullish value as tracing enabled.
})
