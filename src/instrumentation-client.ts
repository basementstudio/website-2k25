import * as Sentry from "@sentry/nextjs"

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate:
    environment === "production" ? 0.05 : environment === "preview" ? 1 : 0,
  // thirdPartyErrorFilterIntegration is better, but its applicationKey loader
  // breaks Turbopack worker modules.
  denyUrls: [/^(?:chrome|moz|ms-browser|safari(?:-web)?)-extension:\/\//],
  // BrowserApiErrors wraps requestAnimationFrame by default — a per-frame cost
  // on the R3F loop.
  integrations: (defaults) => [
    ...defaults.filter(({ name }) => name !== "BrowserApiErrors"),
    Sentry.browserApiErrorsIntegration({
      requestAnimationFrame: false,
      eventTarget: false
    })
  ]
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
