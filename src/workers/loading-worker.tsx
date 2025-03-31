import { render } from "@react-three/offscreen"
import { Vector3 } from "three"

import LoadingScene from "@/components/loading/loading-scene"

export type LoadingWorkerMessageEvent = MessageEvent<{
  type: string
  actualCamera?: {
    position: Vector3
    target: Vector3
    fov: number
  } | null
  isAppLoaded?: boolean
  progress?: number
  modelUrl?: string
}>

self.addEventListener("message", (e: LoadingWorkerMessageEvent) => {
  const { type, modelUrl } = e.data

  if (type === "initialize" && modelUrl) {
    render(<LoadingScene modelUrl={modelUrl} />)
  }
})

self.addEventListener("error", (error) => {
  console.error("[LoadingWorker] Worker error:", error)
})

self.addEventListener("messageerror", (error) => {
  console.error("[LoadingWorker] Message error:", error)
})
