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
  isLoading: boolean
  progress: number
  setIsLoading: (isLoading: boolean) => void
  setProgress: (progress: number) => void
}

export const useAppLoadingStore = create<AppLoadingState>((set) => ({
  isLoading: true,
  progress: 0,
  setIsLoading: (isLoading) => set({ isLoading }),
  setProgress: (progress) => set({ progress })
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
