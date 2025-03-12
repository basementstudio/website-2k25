import { render } from "@react-three/offscreen"

import LoadingScene from "@/components/loading/loading-scene"
import { ICameraConfig } from "@/components/navigation-handler/navigation.interface"

export type LoadingWorkerMessageEvent = MessageEvent<{
  type: string
  cameraConfig?: ICameraConfig
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
