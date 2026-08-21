import * as Sentry from "@sentry/nextjs"

import { resolveTracesSampleRate } from "@/lib/sentry-sampling"

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
  // Chrome reports a worker's failed importScripts to window.onerror even when
  // the Worker error event is canceled, so preventDefault() can't dedupe it.
  // Pinned to Turbopack chunks: the canvas workers refile these under a stable
  // title, the js-dos emulator worker has no such replacement.
  ignoreErrors: [
    /Failed to execute 'importScripts' on 'WorkerGlobalScope'.*\/_next\/static\//
  ],
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
