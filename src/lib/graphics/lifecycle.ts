import * as Sentry from "@sentry/nextjs"
import { create } from "zustand"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useMesh } from "@/hooks/use-mesh"
import { resetCanvasBootTrace } from "@/lib/canvas-boot"

import { useSceneAssets } from "./scene-assets"

export const useGraphicsLifecycle = create<{
  generation: number
  recovering: boolean
  recoveryStartedAt: number
  forceWebGL: boolean
  failed: boolean
  recover: (generation?: number) => void
}>((set, get) => ({
  generation: 0,
  recovering: false,
  recoveryStartedAt: 0,
  forceWebGL: false,
  failed: false,
  recover: (generation) => {
    if (generation !== undefined && generation !== get().generation) return
    Sentry.addBreadcrumb({
      category: "graphics",
      message: get().forceWebGL ? "Recovery failed" : "Recovering with WebGL2"
    })
    if (get().forceWebGL) set({ failed: true, recovering: false })
    else {
      resetCanvasBootTrace()
      useAppLoadingStore.setState({
        canRunMainApp: false,
        showLoadingCanvas: true,
        hasPresentedFrame: false,
        hasLoaderFrame: false,
        loaderFailed: false,
        loaderTransitionComplete: false,
        isSceneRevealing: false,
        revealProgress: { value: 0 },
        canvasBootTimedOut: false
      })
      useMesh.setState(useMesh.getInitialState())
      useSceneAssets.setState({
        ready: new Set(),
        requested: new Set(),
        resourceRevision: 0
      })
      set({
        generation: get().generation + 1,
        forceWebGL: true,
        recovering: true,
        recoveryStartedAt: performance.now()
      })
    }
  }
}))
