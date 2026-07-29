"use client"

import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

// Declares whether the current route group shows the global canvas. Runs in an
// effect (client-only), so it never reads request data at prerender — replacing
// the `usePathname` + blacklist check that forced a <Suspense> boundary.
export const SetCanvasMode = ({ enabled }: { enabled: boolean }) => {
  useEffect(() => {
    if (enabled) {
      // Sticky mount + visible. isCanvasInPage is never set back to false so the
      // Scene stays mounted (WebGL context persists) across navigations.
      useAppLoadingStore.setState({ isCanvasInPage: true, canvasVisible: true })
    } else {
      useAppLoadingStore.setState({ canvasVisible: false })
    }
  }, [enabled])

  return null
}
