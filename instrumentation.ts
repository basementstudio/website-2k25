import * as Sentry from "@sentry/nextjs"

const environment = process.env.VERCEL_ENV ?? "development"

// One init for node and edge; neither needs runtime-specific options.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate:
      environment === "production" ? 0.05 : environment === "preview" ? 1 : 0
  })
}

export const onRequestError = Sentry.captureRequestError
