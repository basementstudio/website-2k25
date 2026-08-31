"use client"

import * as Sentry from "@sentry/nextjs"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "react-error-boundary"

import { CustomCursor } from "@/components/custom-cursor"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import {
  AppLoadingHandler,
  useAppLoadingStore
} from "@/components/loading/app-loading-handler"
import { RemoteCursors } from "@/components/realtime/remote-cursors"
import { useCanvasAvailability } from "@/hooks/use-canvas-availability"
import { markCanvasBootStage } from "@/lib/canvas-boot"
import { cn } from "@/utils/cn"

const Scene = dynamic(
  () =>
    import("@/components/scene").then((mod) => {
      markCanvasBootStage("scene-chunk")
      return mod.Scene
    }),
  { ssr: false, loading: () => null }
)

// Persistent global canvas, mounted once in the root layout so it survives
// client navigations. Whether it's visible is driven by `isCanvasInPage`, which
// route-group layouts set (via <SetCanvasMode>) — no `usePathname` needed.
export const CanvasLayer = () => {
  useCanvasAvailability()

  // `isCanvasInPage` (sticky) keeps the Scene mounted across navigations;
  // `canvasVisible` toggles whether it's shown for the current route.
  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)
  const canvasVisible = useAppLoadingStore((state) => state.canvasVisible)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )

  return (
    <>
      <div className="pointer-events-none fixed top-0 z-50 h-screen w-full">
        <CustomCursor />
        <RemoteCursors />
      </div>

      {/* Dead weight without a renderer: an invisible overlay and a 3D-only viewer. */}
      {!canvasUnavailable && (
        <ErrorBoundary
          fallback={null}
          onError={(error, info) => {
            Sentry.captureReactException(error, info)
            useAppLoadingStore.getState().reportCanvasUnavailable()
          }}
        >
          <div
            className={cn(
              "canvas-container absolute top-0 h-[var(--canvas-offset)] w-full lg:fixed lg:aspect-auto",
              !canvasVisible && "pointer-events-none invisible fixed opacity-0"
            )}
          >
            {isCanvasInPage && <Scene />}
            <AppLoadingHandler />
            <InspectableViewer />
          </div>
        </ErrorBoundary>
      )}
    </>
  )
}
