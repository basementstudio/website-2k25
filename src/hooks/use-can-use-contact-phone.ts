import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

import { useMedia } from "./use-media"

// Single source of truth for whether the phone overlay can be used.
// Both the contact button handler and the Contact mount gate must read
// this same value so the viewport/health gates cannot drift apart.
export const useCanUseContactPhone = () => {
  const isDesktopWidth = useMedia("(min-width: 1024px)")
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )
  const canvasBootTimedOut = useAppLoadingStore(
    (state) => state.canvasBootTimedOut
  )

  return (
    !!isDesktopWidth &&
    canRunMainApp &&
    !canvasUnavailable &&
    !canvasBootTimedOut
  )
}
