import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // The SDK filters no extension noise on its own. thirdPartyErrorFilterIntegration
  // is better but its applicationKey loader breaks Turbopack worker modules.
  denyUrls: [/^(?:chrome|moz|ms-browser|safari(?:-web)?)-extension:\/\//],
  // No `tracesSampleRate` — any non-nullish value, 0 included, enables tracing,
  // and the SDK installs BrowserTracing regardless, so drop it explicitly.
  // BrowserApiErrors is re-added unpatched: by default it wraps
  // requestAnimationFrame, which puts a per-frame allocation on the R3F loop.
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
