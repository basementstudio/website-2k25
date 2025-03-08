"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Vector3 } from "three"
import { create } from "zustand"

// import LoadingCanvas from "./loading-canvas"

const LoadingCanvas = dynamic(
  () => import("./loading-canvas").then((mod) => mod.default),
  {
    ssr: false
  }
)

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

export const useAppLoadingStore = create<AppLoadingState>((set, get) => {
  // const loadingCanvasWorker =

  const store: AppLoadingState = {
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

  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!showLoadingCanvas) {
    return null
  }

  return <LoadingCanvas />
}

export default AppLoadingHandler
