"use client"

import { usePathname } from "next/navigation"
import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { Grid } from "@/components/grid"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"

const Scene = dynamic(
  () => import("@/components/scene").then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => null
  }
)

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
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <Grid />
          <InspectableViewer />
        </div>
      )}

      <div className="layout-container">{children}</div>
    </>
  )
}
