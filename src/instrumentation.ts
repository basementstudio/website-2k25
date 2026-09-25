import * as Sentry from "@sentry/nextjs"

import { resolveTracesSampleRate } from "@/lib/sentry-sampling"

const environment = process.env.VERCEL_ENV ?? "development"

// Upstream services echo submitted addresses back in their error text — e.g.
// Resend's error `message` becomes the thrown Error's message.
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@.]+/g

// One init for node and edge; neither needs runtime-specific options.
export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: resolveTracesSampleRate(
      environment,
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ),
    // Console breadcrumbs carry raw console arguments, and the actions log
    // applicant email and salary there. Vercel's logs already have them.
    integrations: (defaults) =>
      defaults.filter(({ name }) => name !== "Console"),
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
