"use client"

import { Vector3 } from "three"
import { create } from "zustand"

import LoadingCanvas from "./loading-canvas"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

interface AppLoadingState {
  isCanvasInPage: boolean
  showLoadingCanvas: boolean
  worker: Worker | null
  setMainAppRunning: (isAppLoaded: boolean) => void
}

export const useAppLoadingStore = create<AppLoadingState>((set, get) => {
  // const loadingCanvasWorker =

  const store: AppLoadingState = {
    isCanvasInPage: false,
    /**
     * Used to show/hide loading canvas
     */
    showLoadingCanvas: true,
    /**
     * Worker canvas for loading screen
     */
    worker: null,
    /**
     * This function will tell the loading canvas that is ok to reveal the main app
     */
    setMainAppRunning: (isAppLoaded) => {
      get().worker?.postMessage({
        type: "update-loading-status",
        isAppLoaded
      })
    }
  }
  return store
})

function AppLoadingHandler() {
  const showLoadingCanvas = useAppLoadingStore(
    (state) => state.showLoadingCanvas
  )

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)

  if (!isCanvasInPage) {
    return null
  }

  if (!showLoadingCanvas) {
    return null
  }

  return <LoadingCanvas />
}

export default AppLoadingHandler
