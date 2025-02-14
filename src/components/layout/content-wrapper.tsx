"use client"

import { Grid } from "@/components/grid"
import { useShowCanvas } from "@/hooks/use-show-canvas"

import { InspectableViewer } from "../inspectables/inspectable-viewer"
import { Scene } from "../scene"

export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const shouldShowCanvas = useShowCanvas()
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
