"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect, useState } from "react"
import { Vector3 } from "three"
import { create } from "zustand"

import LoadingCanvas from "./loading-canvas"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

// Readiness is reported from inside the R3F tree (<Bakes/>), so a canvas that
// never boots would leave the overlay up forever.
const CANVAS_BOOT_TIMEOUT_MS = 20_000

interface AppLoadingState {
  isCanvasInPage: boolean
  canvasVisible: boolean
  showLoadingCanvas: boolean
  canRunMainApp: boolean
  offscreenCanvasReady: boolean
  worker: Worker | null
  loadingContextReleased: boolean
  canvasUnavailable: boolean
  canvasBootTimedOut: boolean
  setMainAppRunning: (isAppLoaded: boolean) => void
  setCanRunMainApp: (canRunMainApp: boolean) => void
  reportCanvasUnavailable: () => void
}

export const useAppLoadingStore = create<AppLoadingState>((set, get) => {
  const store: AppLoadingState = {
    // Sticky: once true the <Scene/> stays mounted so the WebGL context
    // persists across navigations.
    isCanvasInPage: false,
    // Current route's canvas visibility (toggled per route by <SetCanvasMode>).
    canvasVisible: false,
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
     * The loading canvas has given its WebGL context back. Safari caps how many
     * are live at once, so the contact canvas waits on this before allocating.
     */
    loadingContextReleased: false,
    /**
     * Set by the error boundary, the WebGL2 probe, or a failed context creation
     */
    canvasUnavailable: false,
    /**
     * The scene never reported readiness, so 3D interactions will never work
     */
    canvasBootTimedOut: false,
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
      set({ canRunMainApp, canvasBootTimedOut: false })
    },
    /**
     * Vetoes the canvas; <CanvasLayer/> unmounts the whole subtree from here
     */
    reportCanvasUnavailable: () => {
      if (get().canvasUnavailable) return

      set({ canvasUnavailable: true })
    }
  }
  return store
})

export const AppLoadingHandler = () => {
  const isCanvasInPage = useAppLoadingStore((state) => state.isCanvasInPage)
  const showLoadingCanvas = useAppLoadingStore(
    (state) => state.showLoadingCanvas
  )
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )
  const [removeLoadingNode, setRemoveLoadingNode] = useState(false)

  // This trick is to prevent the white flash that happens when webgl stops
  useEffect(() => {
    if (!showLoadingCanvas) {
      setTimeout(() => {
        setRemoveLoadingNode(true)
      }, 10)
    }
  }, [showLoadingCanvas])

  useEffect(() => {
    // <SetCanvasMode> re-arms isCanvasInPage on navigation, so skip when WebGL
    // is already known dead.
    if (!isCanvasInPage || canRunMainApp || canvasUnavailable) return

    const timeout = setTimeout(() => {
      // A slow scene may still arrive, so don't mark the canvas unavailable.
      useAppLoadingStore.setState({
        showLoadingCanvas: false,
        canvasBootTimedOut: true
      })

      Sentry.captureMessage("Canvas boot timed out", "warning")
    }, CANVAS_BOOT_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [isCanvasInPage, canRunMainApp, canvasUnavailable])

  if (!isCanvasInPage) {
    return null
  }

  if (removeLoadingNode) {
    return null
  }

  return <LoadingCanvas hide={!showLoadingCanvas} />
}
