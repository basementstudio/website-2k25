"use client"

import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

// Declares whether the current route group shows the global canvas. Runs in an
// effect (client-only), so it never reads request data at prerender — replacing
// the `usePathname` + blacklist check that forced a <Suspense> boundary.
export const SetCanvasMode = ({ enabled }: { enabled: boolean }) => {
  useEffect(() => {
    useAppLoadingStore.setState({ isCanvasInPage: enabled })
  }, [enabled])

  return null
}
