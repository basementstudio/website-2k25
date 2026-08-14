import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

import { useWebgl } from "./use-webgl"

const WEBGL_CONTEXT_FAILURE = /webgl context/i

// R3F 9 awaits configure() in a layout effect, so a failed WebGL context rejects
// a floating promise instead of throwing into React — the <ErrorBoundary> around
// the canvas never sees it. Sentry WEBSITE-2K25-39.
export const useCanvasAvailability = () => {
  const webglEnabled = useWebgl()
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )

  useEffect(() => {
    if (webglEnabled) return

    useAppLoadingStore.getState().reportCanvasUnavailable()
  }, [webglEnabled])

  // Lets CSS drop the viewport of space the (canvas) group reserves.
  useEffect(() => {
    document.documentElement.dataset.canvasUnavailable =
      String(canvasUnavailable)
  }, [canvasUnavailable])

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
