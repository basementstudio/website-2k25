import * as Sentry from "@sentry/nextjs"

const environment = process.env.VERCEL_ENV ?? "development"

// Upstream services echo submitted addresses back in their error text — e.g.
// Mailchimp's `detail` becomes the thrown Error's message.
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@.]+/g

// One init for node and edge; neither needs runtime-specific options.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate:
      environment === "production" ? 0.05 : environment === "preview" ? 1 : 0,
    beforeSend(event) {
      if (event.message) event.message = event.message.replace(EMAIL, "[email]")
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) {
          exception.value = exception.value.replace(EMAIL, "[email]")
        }
      }
      return event
    }
  })
}

export const onRequestError = Sentry.captureRequestError
