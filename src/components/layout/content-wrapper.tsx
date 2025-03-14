"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo } from "react"

import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => null
  }
)
import { useGlobalFrameLoop } from "@/hooks/use-pausable-time"
import { cn } from "@/utils/cn"

import { useAppLoadingStore } from "../loading/app-loading-handler"
import { ScrollDown } from "../primitives/scroll-down"

const BLACKLISTED_PATHS = [
  /^\/showcase\/\d+$/,
  /^\/showcase\/[^\/]+$/,
  /^\/post\/[^\/]+$/,
  /^\/project\/[^\/]+$/
  // temp
  // /^\/showcase$/
]

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const shouldShowCanvas = useMemo(() => {
    return !BLACKLISTED_PATHS.some((path) => pathname.match(path))
  }, [pathname])

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)

  // once canvas is in page, never delete it, only hide it
  useEffect(() => {
    if (shouldShowCanvas) {
      useAppLoadingStore.setState({ isCanvasInPage: shouldShowCanvas })
    }
  }, [shouldShowCanvas])

  return (
    <>
      <div
        className={cn(
          "canvas-container sticky top-0 h-screen w-full lg:fixed",
          !shouldShowCanvas && "pointer-events-none invisible fixed opacity-0"
        )}
      >
        <Suspense fallback={null}>{isCanvasInPage && <Scene />}</Suspense>
        <InspectableViewer />
        <ScrollDown />
      </div>

      <div
        className={cn("layout-container", shouldShowCanvas && "lg:mt-[100dvh]")}
      >
        {children}
      </div>
    </>
  )
}
