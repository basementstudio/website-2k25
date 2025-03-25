"use client"

import { useLenis } from "lenis/react"
import { useEffect } from "react"
import { Vector3 } from "three"
import { create } from "zustand"
import { useMedia } from "@/hooks/use-media"

import LoadingCanvas from "./loading-canvas"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

interface AppLoadingState {
  isCanvasInPage: boolean
  showLoadingCanvas: boolean
  canRunMainApp: boolean
  offscreenCanvasReady: boolean
  worker: Worker | null
  setMainAppRunning: (isAppLoaded: boolean) => void
  setCanRunMainApp: (canRunMainApp: boolean) => void
}

export const useAppLoadingStore = create<AppLoadingState>((set, get) => {
  // const loadingCanvasWorker =

  const store: AppLoadingState = {
    isCanvasInPage: false,
    /**
     * Used to check if the offscreen canvas is ready
     */
    offscreenCanvasReady: false,
    /**
     * Used to show/hide loading canvas
     */
    showLoadingCanvas: true,
    /**
     * Used to check if the main app is running
     */
    canRunMainApp: false,
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
    },
    /**
     * This function will tell the loading canvas that the main app can run
     */
    setCanRunMainApp: (canRunMainApp) => {
      set({ canRunMainApp })
    }
  }
  return store
})

function AppLoadingHandler() {
  const showLoadingCanvas = useAppLoadingStore(
    (state) => state.showLoadingCanvas
  )

  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)
  const isMobile = useMedia("(max-width: 1024px)")

  // TODO: update this once we cover "showcase navigation issue"
  const lenis = useLenis()

  useEffect(() => {
    if (showLoadingCanvas && isCanvasInPage && !isMobile) {
      lenis?.stop()
    } else {
      lenis?.start()
    }
  }, [showLoadingCanvas, lenis, isCanvasInPage, isMobile])

  if (!isCanvasInPage) {
    return null
  }

  if (!showLoadingCanvas) {
    return null
  }

  return <LoadingCanvas />
}

export default AppLoadingHandler
