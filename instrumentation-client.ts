import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // No `tracesSampleRate` — any non-nullish value, 0 included, enables tracing.
  // The SDK still installs BrowserTracing by default, so drop it here too:
  // otherwise it registers performance observers on every client.
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "BrowserTracing")
})
