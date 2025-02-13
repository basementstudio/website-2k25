import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

console.log("Worker script loaded")
console.log("OffscreenCanvas support:", typeof OffscreenCanvas !== "undefined")

self.onmessage = (e: MessageEvent<{ type: string; modelUrl: string }>) => {
  console.log("Worker received message:", e.data)
  const { type, modelUrl } = e.data
  if (type === "load-model") {
    console.log("[ContactWorker] loading model", modelUrl)
    try {
      render(<ContactScene modelUrl={modelUrl} />)
    } catch (error) {
      console.error("[ContactWorker] Error rendering scene:", error)
    }
  }
}

self.onerror = (error) => {
  console.error("[ContactWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[ContactWorker] Message error:", error)
}
