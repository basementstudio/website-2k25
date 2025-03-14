import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

let scene: any = null

self.onmessage = (
  e: MessageEvent<{
    type: string
    modelUrl?: string
    isContactOpen?: boolean
  }>
) => {
  const { type, modelUrl, isContactOpen } = e.data

  if (type === "load-model" && modelUrl) {
    try {
      scene = <ContactScene modelUrl={modelUrl} />
      render(scene)
    } catch (error) {
      console.error("[ContactWorker] Error rendering scene:", error)
    }
  } else if (type === "update-contact-open" && isContactOpen !== undefined) {
    self.postMessage({
      type: "update-contact-open",
      isContactOpen
    })
  } else if (type === "outro-complete") {
    self.postMessage({ type: "outro-complete" })
  } else if (type === "intro-complete") {
    self.postMessage({ type: "intro-complete" })
  } else if (type === "start-outro") {
    self.postMessage({ type: "start-outro" })
  } else if (type === "run-outro-animation") {
    self.postMessage({ type: "run-outro-animation" })
  } else if (type === "scale-animation-complete") {
    self.postMessage({ type: "scale-animation-complete" })
  } else if (type === "scale-down-animation-complete") {
    self.postMessage({ type: "scale-down-animation-complete" })
  }
}

self.onerror = (error) => {
  console.error("[ContactWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[ContactWorker] Message error:", error)
}
