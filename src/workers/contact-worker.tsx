import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

console.log("OffscreenCanvas support:", typeof OffscreenCanvas !== "undefined")

self.onmessage = (
  e: MessageEvent<{ type: string; modelUrl: string; idleUrl: string }>
) => {
  const { type, modelUrl, idleUrl } = e.data
  if (type === "load-model") {
    console.log("[ContactWorker] loading model", modelUrl, idleUrl)
    render(<ContactScene modelUrl={modelUrl} />)
  }
}
