"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { Grid } from "@/components/grid"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import { Scene } from "@/components/scene"

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
      {shouldShowCanvas && (
        <div className="canvas-container sticky top-0 h-screen w-full lg:fixed">
          <Scene />
          <Grid />
          <InspectableViewer />
        </div>
      )}

      <div className="layout-container lg:mt-[100dvh]">{children}</div>
    </>
  )
}
