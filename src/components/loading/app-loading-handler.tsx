"use client"

import { useEffect, useState } from "react"
import { create } from "zustand"

import LoadingCanvas from "./loading-canvas"
import { Vector3 } from "three"
import { subscribable } from "@/lib/subscribable"

export type UpdateCameraCallback = (
  cameraPosition: Vector3,
  cameraTarget: Vector3,
  cameraFov: number
) => void

interface AppLoadingState {
  isLoading: boolean
  progress: number
  setIsLoading: (isLoading: boolean) => void
  setProgress: (progress: number) => void
  updateCamera: UpdateCameraCallback
}

export const updateCameraSubscribable = subscribable<UpdateCameraCallback>()

export const useAppLoadingStore = create<AppLoadingState>((set) => ({
  isLoading: true,
  progress: 0,
  setIsLoading: (isLoading) => set({ isLoading }),
  setProgress: (progress) => set({ progress }),
  shouldUpdateCamera: { current: false },
  cameraPosition: new Vector3(),
  cameraTarget: new Vector3(),
  cameraFov: 0,
  updateCamera: updateCameraSubscribable.runCallbacks
}))

function AppLoadingHandler() {
  const { progress } = useAppLoadingStore()

  return (
    <LoadingCanvas
      isVisible={true}
      progress={progress}
      onFinishLoading={() => {
        // This callback can be used for any cleanup needed after loading is complete
      }}
    />
  )
}

export default AppLoadingHandler
