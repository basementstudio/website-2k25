"use client"

import * as Sentry from "@sentry/nextjs"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "react-error-boundary"

import { REALTIME_ENABLED } from "./realtime-store"

const RealtimeImpl = dynamic(
  () => import("./realtime-impl").then((mod) => mod.RealtimeImpl),
  { ssr: false, loading: () => null }
)

export const RealtimeRoot = () => {
  if (!REALTIME_ENABLED) return null

  return (
    <ErrorBoundary
      fallback={null}
      onError={(error, info) => Sentry.captureReactException(error, info)}
    >
      <RealtimeImpl />
    </ErrorBoundary>
  )
}
