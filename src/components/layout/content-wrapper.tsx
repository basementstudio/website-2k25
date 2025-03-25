"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"

import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => null
  }
)

import { cn } from "@/utils/cn"

import { CustomCursor } from "../custom-cursor"
import { useAppLoadingStore } from "../loading/app-loading-handler"

const BLACKLISTED_PATHS = [
  /^\/showcase\/\d+$/,
  /^\/showcase\/[^\/]+$/,
  /^\/post\/[^\/]+$/,
  /^\/project\/[^\/]+$/,
  /^\/contact$/
]

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const shouldShowCanvas = useMemo(() => {
    return !BLACKLISTED_PATHS.some((path) => pathname.match(path))
  }, [pathname])

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)

  useEffect(() => {
    if (shouldShowCanvas) {
      useAppLoadingStore.setState({ isCanvasInPage: shouldShowCanvas })
    }
  }, [shouldShowCanvas])

  return (
    <>
      <div className="pointer-events-none fixed top-0 z-50 h-screen w-full">
        <CustomCursor />
      </div>

      <div
        className={cn(
          "canvas-container sticky top-0 aspect-video w-full lg:fixed lg:aspect-auto lg:h-[100svh]",
          !shouldShowCanvas && "pointer-events-none invisible fixed opacity-0"
        )}
      >
        {isCanvasInPage && <Scene />}
        <InspectableViewer />
      </div>

      <div
        className={cn("layout-container", shouldShowCanvas && "lg:mt-[100dvh]")}
      >
        {children}
      </div>
    </>
  )
}
