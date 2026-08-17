import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

const WEBGL_CONTEXT_FAILURE = /webgl context/i

// R3F 9 awaits configure() in a layout effect, so a failed WebGL context rejects
// a floating promise instead of throwing into React — the <ErrorBoundary> around
// the canvas never sees it. Sentry WEBSITE-2K25-39.
export const useCanvasAvailability = () => {
  // The WebGL2 probe runs in an inline pre-paint script (src/app/layout.tsx) so
  // CSS can drop the (canvas) reserve before first paint — collapsing it from a
  // useEffect scored ~0.8 CLS on mobile. Here we only sync the store with that
  // decision. Late failures (error boundary, rejection below) still prune the
  // scene subtree but must never touch the dataset: shifting the page post-paint
  // is worse than keeping an empty reserve.
  useEffect(() => {
    if (document.documentElement.dataset.canvasUnavailable !== "true") return

    useAppLoadingStore.getState().reportCanvasUnavailable()
  }, [])

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? "")

      if (!WEBGL_CONTEXT_FAILURE.test(message)) return

      useAppLoadingStore.getState().reportCanvasUnavailable()
    }

    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])
}
