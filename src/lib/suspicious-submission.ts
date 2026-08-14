const MIN_SUBMISSION_TIME_MS = 3_000

interface BotSignals {
  /** Honeypot — hidden from humans, so any value means a form-filler. */
  companyWebsite: string
  formStartedAt: number
}

// Not in the action: `"use server"` files may only export async functions, and
// the form needs this verdict client-side too.
export function isSuspiciousSubmission(signals: BotSignals, now: number) {
  if (signals.companyWebsite.trim()) {
    return true
  }

  if (!Number.isFinite(signals.formStartedAt)) {
    return true
  }

  return now - signals.formStartedAt < MIN_SUBMISSION_TIME_MS
}
