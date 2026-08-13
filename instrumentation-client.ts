import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // thirdPartyErrorFilterIntegration is better, but its applicationKey loader
  // breaks Turbopack worker modules.
  denyUrls: [/^(?:chrome|moz|ms-browser|safari(?:-web)?)-extension:\/\//],
  // Any non-nullish `tracesSampleRate`, 0 included, enables tracing.
  // BrowserApiErrors wraps requestAnimationFrame by default — a per-frame cost
  // on the R3F loop.
  integrations: (defaults) => [
    ...defaults.filter(
      ({ name }) => name !== "BrowserTracing" && name !== "BrowserApiErrors"
    ),
    Sentry.browserApiErrorsIntegration({
      requestAnimationFrame: false,
      eventTarget: false
    })
  ]
})
