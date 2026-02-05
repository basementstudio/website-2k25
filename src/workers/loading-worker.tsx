import { render } from "@react-three/offscreen"
import { Vector3 } from "three"
import { WebGPURenderer } from "three/webgpu"

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

    // Intercept the onmessage handler set by render() to override
    // the renderer with WebGPURenderer (needed for TSL/NodeMaterial)
    const originalHandler = self.onmessage
    self.onmessage = (event: MessageEvent) => {
      if (event.data.type === "init") {
        event.data.payload.props.gl = async (defaultProps: any) => {
          const renderer = new WebGPURenderer({
            canvas: defaultProps.canvas,
            antialias: true,
            alpha: true
          })
          await renderer.init()
          return renderer
        }
      }

      // Block "props" messages to prevent a race condition with async WebGPU init.
      // The OffscreenCanvas component sends a "props" message on mount that arrives
      // while the async "init" is still in progress, causing R3F to create a second
      // (WebGL) renderer. This prevents the WebGPU renderer from being properly sized
      // since R3F's resize subscription only fires setSize when size/dpr changes.
      // The "init" message already includes all necessary props (frameloop, etc.).
      if (event.data.type === "props") return

      originalHandler?.call(self, event)
    }
  }
})

self.addEventListener("error", (error) => {
  console.error("[LoadingWorker] Worker error:", error)
})

self.addEventListener("messageerror", (error) => {
  console.error("[LoadingWorker] Message error:", error)
})
