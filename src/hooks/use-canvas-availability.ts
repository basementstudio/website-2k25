import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useGraphicsLifecycle } from "@/lib/graphics/lifecycle"

export const useCanvasAvailability = () => {
  const failed = useGraphicsLifecycle((s) => s.failed)
  const unavailable = useAppLoadingStore((s) => s.canvasUnavailable)
  useEffect(() => {
    if (failed) useAppLoadingStore.getState().reportCanvasUnavailable()
  }, [failed])
  useEffect(() => {
    if (unavailable) document.documentElement.dataset.canvasUnavailable = "true"
  }, [unavailable])
}
