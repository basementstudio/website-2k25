import * as Sentry from "@sentry/nextjs"

import { resolveTracesSampleRate } from "@/lib/sentry-sampling"

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development"

const ANONYMOUS_ID_KEY = "sentry-anonymous-id"

// Without an id every issue reports "0 users impacted". Pseudonymous so
// sendDefaultPii can stay off.
const resolveAnonymousId = () => {
  try {
    const stored = sessionStorage.getItem(ANONYMOUS_ID_KEY)
    if (stored) return stored

    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    sessionStorage.setItem(ANONYMOUS_ID_KEY, id)
    return id
  } catch {
    // Storage throws in some embedded and hardened-privacy contexts.
    return undefined
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: resolveTracesSampleRate(
    environment,
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  ),
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

const anonymousId = resolveAnonymousId()

if (anonymousId) {
  Sentry.setUser({ id: anonymousId })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
