"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
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
  /^\/contact$/
]

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const [errorBoundaryTriggered, setErrorBoundaryTriggered] = useState(false)
  const pathname = usePathname()
  const shouldShowCanvas = useMemo(() => {
    if (errorBoundaryTriggered) return false
    return !BLACKLISTED_PATHS.some((path) => pathname.match(path))
  }, [pathname, errorBoundaryTriggered])

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)

  useEffect(() => {
    if (shouldShowCanvas) {
      useAppLoadingStore.setState({ isCanvasInPage: shouldShowCanvas })
    }
  }, [shouldShowCanvas, errorBoundaryTriggered])

  return (
    <>
      <div className="pointer-events-none fixed top-0 z-50 h-screen w-full">
        <CustomCursor />
      </div>

      <ErrorBoundary
        fallback={<div className="h-[38px]" />}
        onError={() => {
          setErrorBoundaryTriggered(true)
          useAppLoadingStore.setState({ isCanvasInPage: false })
          useAppLoadingStore.setState({ canvasErrorBoundaryTriggered: true })
        }}
      >
        <TestWithError />
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

const TestWithError = () => {
  useEffect(() => {
    throw new Error("Test error")
  }, [])

  return null
}
