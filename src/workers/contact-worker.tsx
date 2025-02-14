import { render } from "@react-three/offscreen"
import { create } from "zustand"

import ContactScene from "@/components/contact/contact-scene"

console.log("Worker script loaded")
console.log("OffscreenCanvas support:", typeof OffscreenCanvas !== "undefined")

interface WorkerStore {
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
  updateFormData: (formData: WorkerStore["formData"]) => void
}

export const useWorkerStore = create<WorkerStore>((set) => ({
  formData: {
    name: "",
    company: "",
    email: "",
    budget: "",
    message: ""
  },
  updateFormData: (formData) => {
    console.log("[WorkerStore] Updating form data:", formData)
    set({ formData })
  }
}))

let scene: any = null

self.onmessage = (
  e: MessageEvent<{
    type: string
    modelUrl?: string
    formData?: WorkerStore["formData"]
  }>
) => {
  const { type, modelUrl, formData } = e.data

  if (type === "load-model" && modelUrl) {
    try {
      scene = <ContactScene modelUrl={modelUrl} />
      render(scene)
    } catch (error) {
      console.error("[ContactWorker] Error rendering scene:", error)
    }
  }

  // Forward text changes to the scene
  if (type === "update-form" && formData) {
    self.postMessage({ type: "update-form", formData })
  }
}

self.onerror = (error) => {
  console.error("[ContactWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[ContactWorker] Message error:", error)
}
