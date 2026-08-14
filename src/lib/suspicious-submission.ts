const MIN_SUBMISSION_TIME_MS = 3_000

interface BotSignals {
  /** Honeypot — hidden from humans, so any value means a form-filler. */
  companyWebsite: string
  formStartedAt: number
}

// Shared with the career form itself, which needs the same verdict to keep bot
// submissions out of the analytics count. Kept out of the `"use server"` file
// because those may only export async functions.
export function isSuspiciousSubmission(signals: BotSignals, now: number) {
  if (signals.companyWebsite.trim()) {
    return true
  }

  if (!Number.isFinite(signals.formStartedAt)) {
    return true
  }

  return now - signals.formStartedAt < MIN_SUBMISSION_TIME_MS
}
