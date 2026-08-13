import * as Sentry from "@sentry/nextjs"

// One init for node and edge; neither needs runtime-specific options.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    enabled: process.env.NODE_ENV === "production"
  })
}

export const onRequestError = Sentry.captureRequestError
