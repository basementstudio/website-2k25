"use client"

import { useEffect, useState } from "react"
import { Vector3 } from "three"
import { create } from "zustand"

import LoadingCanvas from "./loading-canvas"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

interface AppLoadingState {
  showLoadingCanvas: boolean
  worker: Worker | null
  setMainAppRunning: (isAppLoaded: boolean) => void
}

export const useAppLoadingStore = create<AppLoadingState>((set) => {
  const loadingCanvasWorker =
    typeof Worker !== "undefined"
      ? new Worker(new URL("@/workers/loading-worker.tsx", import.meta.url), {
          type: "module"
        })
      : null

  const store: AppLoadingState = {
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
      loadingCanvasWorker?.postMessage({
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
  const loadingCanvasWorker = useAppLoadingStore((state) => state.worker)

  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!showLoadingCanvas || !loadingCanvasWorker || !hydrated) {
    return null
  }

  return <LoadingCanvas loadingCanvasWorker={loadingCanvasWorker} />
}

export default AppLoadingHandler
