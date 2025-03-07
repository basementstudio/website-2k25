"use client"

import { usePathname } from "next/navigation"
import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => null
  }
)
import { cn } from "@/utils/cn"

import { ScrollDown } from "../primitives/scroll-down"

const BLACKLISTED_PATHS = [
  /^\/blog\/\d+$/,
  /^\/blog\/[^\/]+$/,
  /^\/showcase\/\d+$/,
  /^\/showcase\/[^\/]+$/
]

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const shouldShowCanvas = useMemo(() => {
    return !BLACKLISTED_PATHS.some((path) => pathname.match(path))
  }, [pathname])

  return (
    <>
      <div
        className={cn(
          "canvas-container sticky top-0 h-screen w-full lg:fixed",
          !shouldShowCanvas && "pointer-events-none invisible opacity-0"
        )}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
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
