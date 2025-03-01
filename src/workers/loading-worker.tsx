import { render } from "@react-three/offscreen"
import { create } from "zustand"

import LoadingScene from "@/components/loading/loading-scene"
import { Vector3 } from "three"
import { Suspense } from "react"

interface LoadingWorkerStore {
  isAppLoaded: boolean
  progress: number
  setIsAppLoaded: (isLoaded: boolean) => void
  setProgress: (progress: number) => void
  cameraPosition: Vector3
  cameraFov: number
  cameraTarget: Vector3
}

const target = new Vector3(5, 2, -15)

const position = target.clone().add(new Vector3(1, 1, 1).multiplyScalar(15))

export const useLoadingWorkerStore = create<LoadingWorkerStore>((set) => ({
  isAppLoaded: false,
  progress: 0,
  setIsAppLoaded: (isLoaded) => set({ isAppLoaded: isLoaded }),
  setProgress: (progress) => set({ progress: progress }),
  cameraPosition: position,
  cameraFov: 50,
  cameraTarget: target
}))

let scene: React.ReactNode = null

export type LoadingMessageEvent = MessageEvent<{
  type: string
  isAppLoaded?: boolean
  progress?: number
  cameraPosition?: { x: number; y: number; z: number }
  cameraTarget?: { x: number; y: number; z: number }
  cameraFov?: number
  modelUrl?: string
}>

self.onmessage = (e: LoadingMessageEvent) => {
  const { type, modelUrl } = e.data

  if (type === "initialize" && modelUrl) {
    try {
      scene = <LoadingScene modelUrl={modelUrl} />
      render(scene)
    } catch (error) {
      console.error("[LoadingWorker] Error rendering scene:", error)
    }
  }
}

self.onerror = (error) => {
  console.error("[LoadingWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[LoadingWorker] Message error:", error)
}
