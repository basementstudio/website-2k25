import * as Sentry from "@sentry/nextjs"
import { initBotId } from "botid/client/core"

import { resolveTracesSampleRate } from "@/lib/sentry-sampling"

// Every `(site)` route: the contact overlay is in its layout and actions POST to the
// invoking page. Unlisted paths fail closed; a catch-all would break /studio/* POSTs.
initBotId({
  protect: [
    { path: "/", method: "POST" },
    { path: "/blog", method: "POST" },
    { path: "/blog/*", method: "POST" },
    { path: "/people", method: "POST" },
    { path: "/services", method: "POST" },
    { path: "/showcase", method: "POST" },
    { path: "/showcase/*", method: "POST" },
    { path: "/post/*", method: "POST" },
    { path: "/careers/*", method: "POST" },
    { path: "/contact", method: "POST" },
    { path: "/basketball", method: "POST" },
    { path: "/doom", method: "POST" },
    { path: "/lab", method: "POST" }
  ]
})

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development"

const ANONYMOUS_ID_KEY = "sentry-anonymous-id"

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

// Without an id every issue reports "0 users impacted". Pseudonymous so
// sendDefaultPii can stay off.
try {
  const stored = sessionStorage.getItem(ANONYMOUS_ID_KEY)
  const id = stored ?? crypto.randomUUID()

  if (!stored) sessionStorage.setItem(ANONYMOUS_ID_KEY, id)
  Sentry.setUser({ id })
} catch {
  // Storage throws in some embedded and hardened-privacy contexts.
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
