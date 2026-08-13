import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  enabled: process.env.NODE_ENV === "production",
  // Nothing filters extension noise by default — the SDK's own extension check
  // only fires when the page *itself* is an extension URL. The stack-frame
  // based `thirdPartyErrorFilterIntegration` would be better, but its
  // `applicationKey` loader can't read Turbopack's virtual worker modules and
  // fails the build (src/workers/loading-worker.tsx).
  denyUrls: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-(web-)?extension:\/\//
  ],
  // No `tracesSampleRate` — any non-nullish value, 0 included, enables tracing.
  // The SDK still installs BrowserTracing by default, so drop it here too:
  // otherwise it registers performance observers on every client.
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "BrowserTracing")
})
