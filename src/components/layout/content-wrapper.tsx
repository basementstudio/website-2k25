"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { Grid } from "@/components/grid"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import { Scene } from "@/components/scene"
import { cn } from "@/utils/cn"

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
        <Scene />
        <Grid />
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
