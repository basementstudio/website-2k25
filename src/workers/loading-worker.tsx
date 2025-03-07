import { render } from "@react-three/offscreen"

import LoadingScene from "@/components/loading/loading-scene"
import { ICameraConfig } from "@/components/navigation-handler/navigation.interface"

let scene: React.ReactNode = null

export type LoadingWorkerMessageEvent = MessageEvent<{
  type: string
  cameraConfig?: ICameraConfig
  isAppLoaded?: boolean
  progress?: number
  modelUrl?: string
}>

self.onmessage = (e: LoadingWorkerMessageEvent) => {
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
