import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

let windowDimensions = {
  width: 1920,
  height: 1080
}

self.onmessage = ({ data }) => {
  const {
    type,
    modelUrl,
    isContactOpen,
    windowDimensions: newDimensions
  } = data

  if (newDimensions) {
    windowDimensions = newDimensions
  }

  if (type === "window-resize" && newDimensions) {
    self.postMessage({ type: "window-resize" })
    return
  }

  if (type === "load-model" && modelUrl) {
    try {
      // @ts-ignore - Pass window dimensions to the ContactScene
      self.windowDimensions = windowDimensions
      render(<ContactScene modelUrl={modelUrl} />)
    } catch (error) {
      console.error("[ContactWorker] Error rendering scene:", error)
    }
    return
  }

  if (
    [
      "update-contact-open",
      "outro-complete",
      "intro-complete",
      "start-outro",
      "run-outro-animation",
      "scale-animation-complete",
      "scale-down-animation-complete",
      "screen-dimensions",
      "submit-clicked",
      "animation-starting",
      "animation-complete"
    ].includes(type)
  ) {
    self.postMessage({
      type,
      ...(isContactOpen !== undefined && { isContactOpen })
    })
  }
}

self.onerror = (error) => console.error("[ContactWorker] Worker error:", error)
self.onmessageerror = (error) =>
  console.error("[ContactWorker] Message error:", error)
