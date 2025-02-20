import { render } from "@react-three/offscreen"
import { create } from "zustand"

import ContactScene from "@/components/contact/contact-scene"

interface WorkerStore {
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
  focusedElement: string | null
  updateFormData: (formData: WorkerStore["formData"]) => void
  updateFocusedElement: (elementId: string | null) => void
}

export const useWorkerStore = create<WorkerStore>((set) => ({
  formData: {
    name: "",
    company: "",
    email: "",
    budget: "",
    message: ""
  },
  focusedElement: null,
  updateFormData: (formData) => {
    set({ formData })
  },
  updateFocusedElement: (elementId) => {
    set({ focusedElement: elementId })
  }
}))

let scene: any = null

self.onmessage = (
  e: MessageEvent<{
    type: string
    modelUrl?: string
    formData?: WorkerStore["formData"]
    focusedElement?: string | null
  }>
) => {
  const { type, modelUrl, formData, focusedElement } = e.data

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
    useWorkerStore.getState().updateFormData(formData)
  }

  // Handle focus updates
  if (type === "update-focus") {
    if (focusedElement === undefined) {
      console.warn("[ContactWorker] Received undefined focusedElement")
      return
    }
    useWorkerStore.getState().updateFocusedElement(focusedElement)
  }
}

self.onerror = (error) => {
  console.error("[ContactWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[ContactWorker] Message error:", error)
}
