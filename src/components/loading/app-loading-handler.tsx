"use client"

import { useEffect } from "react"
import { Vector3 } from "three"
import { create } from "zustand"

import {
  armCanvasBootDeadline,
  captureCanvasBootRecovery,
  captureCanvasBootTimeout,
  startCanvasBootTrace,
  stopCanvasBootTrace
} from "@/lib/canvas-boot"

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
  hasPresentedFrame: boolean
  hasLoaderFrame: boolean
  loaderFailed: boolean
  loaderTransitionComplete: boolean
  isSceneRevealing: boolean
  revealProgress: { value: number }
  canRunMainApp: boolean
  canvasUnavailable: boolean
  canvasBootTimedOut: boolean
  setMainAppRunning: (isAppLoaded: boolean) => void
  setCanRunMainApp: (canRunMainApp: boolean) => void
  reportCanvasUnavailable: () => void
}

export const useAppLoadingStore = create<AppLoadingState>((set, get) => {
  const store: AppLoadingState = {
    // Sticky: once true the <Scene/> stays mounted so the renderer
    // persists across navigations.
    isCanvasInPage: false,
    // Current route's canvas visibility (toggled per route by <SetCanvasMode>).
    canvasVisible: false,
    /**
     * Used to show/hide loading canvas
     */
    showLoadingCanvas: true,
    hasPresentedFrame: false,
    hasLoaderFrame: false,
    loaderFailed: false,
    loaderTransitionComplete: false,
    isSceneRevealing: false,
    // Mutable per-frame value: fading must not re-render the React scene tree.
    revealProgress: { value: 0 },
    /**
     * Used to check if the main app is running
     */
    canRunMainApp: false,
    /**
     * Set after renderer initialization/recovery cannot provide interactive 3D.
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
      set({
        showLoadingCanvas: !isAppLoaded,
        hasPresentedFrame: isAppLoaded,
        isSceneRevealing: false
      })
    },
    /**
     * This function will tell the loading canvas that the main app can run
     */
    setCanRunMainApp: (canRunMainApp) => {
      if (canRunMainApp && get().canvasBootTimedOut) captureCanvasBootRecovery()

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
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )

  useEffect(() => {
    // <SetCanvasMode> re-arms isCanvasInPage on navigation, so skip when WebGL
    // is already known dead.
    if (!isCanvasInPage || canRunMainApp || canvasUnavailable) return

    // Starts the clock on the same tick the budget is armed, so both are
    // measured against the same t0.
    startCanvasBootTrace()

    // Counts down only while the tab is visible, so a backgrounded tab is never
    // charged for a boot it was never given the frames to finish.
    armCanvasBootDeadline(CANVAS_BOOT_TIMEOUT_MS, () => {
      // A slow scene may still arrive, so don't mark the canvas unavailable.
      useAppLoadingStore.setState({ canvasBootTimedOut: true })

      captureCanvasBootTimeout(CANVAS_BOOT_TIMEOUT_MS)
    })

    return () => stopCanvasBootTrace()
  }, [isCanvasInPage, canRunMainApp, canvasUnavailable])

  return null
}
