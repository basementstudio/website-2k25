import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

import { useMedia } from "./use-media"

// The mount gate and the button handler both read this, so the viewport and
// canvas-health gates cannot drift apart. They only differ in how they treat
// boot: the handler waits it out, the mount gate stays closed until it lands.
export const useContactPhoneAvailability = () => {
  const isDesktopWidth = useMedia("(min-width: 1024px)")
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )
  const canvasBootTimedOut = useAppLoadingStore(
    (state) => state.canvasBootTimedOut
  )

  const isSupported =
    !!isDesktopWidth && !canvasUnavailable && !canvasBootTimedOut

  return { isSupported, canOpen: isSupported && canRunMainApp }
}
