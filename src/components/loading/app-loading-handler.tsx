"use client"

import { Vector3 } from "three"
import { create } from "zustand"

import LoadingCanvas from "./loading-canvas"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

const loadingCanvasWorker = new Worker(
  new URL("@/workers/loading-worker.tsx", import.meta.url),
  {
    type: "module"
  }
)

interface AppLoadingState {
  showLoadingCanvas: boolean
  worker: Worker
  setMainAppRunning: (isAppLoaded: boolean) => void
}

export const useAppLoadingStore = create<AppLoadingState>((set) => ({
  /**
   * Used to show/hide loading canvas
   */
  showLoadingCanvas: true,
  /**
   * Worker canvas for loading screen
   */
  worker: loadingCanvasWorker,
  /**
   * This function will tell the loading canvas that is ok to reveal the main app
   */
  setMainAppRunning: (isAppLoaded) => {
    loadingCanvasWorker.postMessage({
      type: "update-loading-status",
      isAppLoaded
    })
  }
}))

function AppLoadingHandler() {
  const showLoadingCanvas = useAppLoadingStore(
    (state) => state.showLoadingCanvas
  )

  if (!showLoadingCanvas) {
    return null
  }

  return <LoadingCanvas />
}

export default AppLoadingHandler
