"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { useEffect, useMemo } from "react"
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
  {
    ssr: false,
    loading: () => null
  }
)

const BLACKLISTED_PATHS = [
  /^\/showcase\/\d+$/,
  /^\/showcase\/[^\/]+$/,
  /^\/post\/[^\/]+$/,
  /^\/contact$/,
  /^\/webby$/
]

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const canvasErrorBoundaryTriggered = useAppLoadingStore(
    (state) => state.canvasErrorBoundaryTriggered
  )
  const shouldShowCanvas = useMemo(() => {
    if (canvasErrorBoundaryTriggered) return false
    return !BLACKLISTED_PATHS.some((path) => pathname.match(path))
  }, [pathname, canvasErrorBoundaryTriggered])

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)

  useEffect(() => {
    if (shouldShowCanvas) {
      useAppLoadingStore.setState({ isCanvasInPage: shouldShowCanvas })
    }
  }, [shouldShowCanvas, canvasErrorBoundaryTriggered])

  return (
    <>
      <div className="pointer-events-none fixed top-0 z-50 h-screen w-full">
        <CustomCursor />
      </div>

      <ErrorBoundary
        fallback={<div className="h-[37px]" aria-hidden />}
        onError={(error) => {
          posthog.captureException(error)
          useAppLoadingStore.setState({ canvasErrorBoundaryTriggered: true })
          useAppLoadingStore.setState({ isCanvasInPage: false })
        }}
      >
        <div
          className={cn(
            "canvas-container relative top-0 h-[80svh] w-full lg:fixed lg:aspect-auto lg:h-[100svh]",
            !shouldShowCanvas && "pointer-events-none invisible fixed opacity-0"
          )}
        >
          {isCanvasInPage && <Scene />}
          <AppLoadingHandler />
          <InspectableViewer />
        </div>
      </ErrorBoundary>

      <div
        className={cn("layout-container", shouldShowCanvas && "lg:mt-[100dvh]")}
      >
        {children}
      </div>
    </>
  )
}
