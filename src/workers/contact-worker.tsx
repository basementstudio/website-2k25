import { render } from "@react-three/offscreen"
import { create } from "zustand"

import ContactScene from "@/components/contact/contact-scene"

interface WorkerStore {
  isContactOpen: boolean
  isClosing: boolean
  setIsContactOpen: (isOpen: boolean) => void
}

export const useWorkerStore = create<WorkerStore>((set) => ({
  isContactOpen: false,
  isClosing: false,
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

    isContactOpen?: boolean
  }>
) => {
  const {
    type,
    modelUrl,

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
