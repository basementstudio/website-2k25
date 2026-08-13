"use client"

import { useEffect } from "react"

// TEMPORARY — verification surface for the Sentry rollout. Delete before merge.
// Throws after mount so the prerender still succeeds; the throw propagates to
// global-error.tsx, which is the client capture path under test.
export default function SentryCheckPage() {
  useEffect(() => {
    throw new Error("sentry-check: client runtime")
  }, [])

  return <p>sentry-check</p>
}
