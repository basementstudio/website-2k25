import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

self.onmessage = ({ data }) => {
  const { type, modelUrl, isContactOpen } = data

  // Handle model loading
  if (type === "load-model" && modelUrl) {
    try {
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
      "scale-down-animation-complete"
    ].includes(type)
  ) {
    self.postMessage({
      type,
      ...(isContactOpen !== undefined && { isContactOpen })
    })
  }
}

// Error handling
self.onerror = (error) => console.error("[ContactWorker] Worker error:", error)
self.onmessageerror = (error) =>
  console.error("[ContactWorker] Message error:", error)
