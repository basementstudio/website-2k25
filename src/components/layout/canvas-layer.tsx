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
import { useCanvasAvailability } from "@/hooks/use-canvas-availability"
import { cn } from "@/utils/cn"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
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
      </div>

      {/* Without a renderer this whole subtree is dead weight: an invisible
          fixed overlay plus a viewer that only drives 3D items. */}
      {!canvasUnavailable && (
        <ErrorBoundary
          fallback={<div className="h-[37px]" aria-hidden />}
          onError={(error, info) => {
            Sentry.captureReactException(error, info)
            useAppLoadingStore.getState().reportCanvasUnavailable()
          }}
        >
          <div
            className={cn(
              "canvas-container relative top-0 h-[80svh] w-full lg:fixed lg:aspect-auto lg:h-[100svh]",
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
