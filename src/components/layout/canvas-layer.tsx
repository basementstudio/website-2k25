"use client"

import dynamic from "next/dynamic"
import posthog from "posthog-js"
import { ErrorBoundary } from "react-error-boundary"

import { CustomCursor } from "@/components/custom-cursor"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import {
  AppLoadingHandler,
  useAppLoadingStore
} from "@/components/loading/app-loading-handler"
import { cn } from "@/utils/cn"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
  { ssr: false, loading: () => null }
)

// Persistent global canvas, mounted once in the root layout so it survives
// client navigations. Whether it's visible is driven by `isCanvasInPage`, which
// route-group layouts set (via <SetCanvasMode>) — no `usePathname` needed.
export const CanvasLayer = () => {
  // `isCanvasInPage` (sticky) keeps the Scene mounted across navigations;
  // `canvasVisible` toggles whether it's shown for the current route.
  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)
  const canvasVisible = useAppLoadingStore((state) => state.canvasVisible)
  const canvasErrorBoundaryTriggered = useAppLoadingStore(
    (state) => state.canvasErrorBoundaryTriggered
  )
  const show = canvasVisible && !canvasErrorBoundaryTriggered

  return (
    <>
      <div className="pointer-events-none fixed top-0 z-50 h-screen w-full">
        <CustomCursor />
      </div>

      <ErrorBoundary
        fallback={<div className="h-[37px]" aria-hidden />}
        onError={(error) => {
          posthog.captureException(error)
          useAppLoadingStore.setState({
            canvasErrorBoundaryTriggered: true,
            isCanvasInPage: false
          })
        }}
      >
        <div
          className={cn(
            "canvas-container relative top-0 h-[80svh] w-full lg:fixed lg:aspect-auto lg:h-[100svh]",
            !show && "pointer-events-none invisible fixed opacity-0"
          )}
        >
          {isCanvasInPage && <Scene />}
          <AppLoadingHandler />
          <InspectableViewer />
        </div>
      </ErrorBoundary>
    </>
  )
}
