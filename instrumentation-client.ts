import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production"
  // Error tracking only. `tracesSampleRate` is omitted, not zeroed: the SDK
  // treats any non-nullish value as tracing enabled and still instruments
  // navigations and requests.
})

// Genuinely inert with tracing off — it forwards to a handler only
// browserTracingIntegration registers — but the build plugin logs an
// unconditional ACTION REQUIRED warning without it.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
