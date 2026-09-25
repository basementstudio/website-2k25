import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { isWebGL2Available } from "@/lib/webgl"

const WEBGL_CONTEXT_FAILURE = /webgl context/i

// R3F 9 awaits configure() in a layout effect, so a failed WebGL context rejects
// a floating promise instead of throwing into React — the <ErrorBoundary> around
// the canvas never sees it. Sentry WEBSITE-2K25-39.
export const useCanvasAvailability = () => {
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )

  useEffect(() => {
    if (isWebGL2Available()) return

    useAppLoadingStore.getState().reportCanvasUnavailable()
  }, [])

  // Lets CSS drop the viewport of space the (canvas) group reserves.
  useEffect(() => {
    if (!canvasUnavailable) return

    document.documentElement.dataset.canvasUnavailable = "true"
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
