import * as Sentry from "@sentry/nextjs"

// Covers both the node and edge runtimes — `@sentry/nextjs` resolves the right
// build per runtime, and neither needs runtime-specific options.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    enabled: process.env.NODE_ENV === "production"
    // No `tracesSampleRate` — any non-nullish value, 0 included, enables tracing.
  })
}

export const onRequestError = Sentry.captureRequestError
