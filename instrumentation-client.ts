import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // The SDK filters no extension noise on its own. thirdPartyErrorFilterIntegration
  // is better but its applicationKey loader breaks Turbopack worker modules.
  denyUrls: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-(web-)?extension:\/\//
  ],
  // No `tracesSampleRate` — any non-nullish value, 0 included, enables tracing,
  // and the SDK installs BrowserTracing regardless, so drop it explicitly.
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "BrowserTracing")
})
