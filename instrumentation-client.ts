import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // Error tracking only — the WebGL bundle is heavy enough without the
  // tracing and session-replay integrations.
  tracesSampleRate: 0
})

// No-op while tracing is off, but the SDK logs an ACTION REQUIRED warning on
// every build without it.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
