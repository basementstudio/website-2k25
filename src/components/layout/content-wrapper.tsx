"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { Grid } from "@/components/grid"

import { InspectableViewer } from "../inspectables/inspectable-viewer"
import { Scene } from "../scene"

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
        <div className="canvas-container sticky top-0 h-screen w-full">
          <Scene />
          <Grid />
          <InspectableViewer />
        </div>
      )}

      <div className="layout-container">{children}</div>
    </>
  )
}
