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
  cursorPosition: number
  isContactOpen: boolean
  isClosing: boolean
  updateFormData: (formData: WorkerStore["formData"]) => void
  updateFocusedElement: (elementId: string | null, cursorPos?: number) => void
  setIsContactOpen: (isOpen: boolean) => void
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
  cursorPosition: 0,
  isContactOpen: false,
  isClosing: false,
  updateFormData: (formData) => {
    set({ formData })
  },
  updateFocusedElement: (elementId, cursorPos = 0) => {
    set({ focusedElement: elementId, cursorPosition: cursorPos })
  },
  setIsContactOpen: (isOpen) => {
    if (!isOpen) {
      set({ isClosing: true })
      setTimeout(() => {
        set({ isContactOpen: false, isClosing: false })
      }, 1000)
    } else {
      set({ isContactOpen: true, isClosing: false })
    }
  }
}))

let scene: any = null

self.onmessage = (
  e: MessageEvent<{
    type: string
    modelUrl?: string
    formData?: WorkerStore["formData"]
    focusedElement?: string | null
    cursorPosition?: number
    isContactOpen?: boolean
  }>
) => {
  const {
    type,
    modelUrl,
    formData,
    focusedElement,
    cursorPosition,
    isContactOpen
  } = e.data

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
    useWorkerStore
      .getState()
      .updateFocusedElement(focusedElement, cursorPosition)
  }

  if (type === "update-contact-open" && typeof isContactOpen === "boolean") {
    const store = useWorkerStore.getState()
    if (isContactOpen === false) {
      store.setIsContactOpen(false)
    } else {
      store.setIsContactOpen(true)
    }
  }
}

self.onerror = (error) => {
  console.error("[ContactWorker] Worker error:", error)
}

self.onmessageerror = (error) => {
  console.error("[ContactWorker] Message error:", error)
}
