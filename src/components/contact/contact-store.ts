import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  isClosing: boolean
  setIsContactOpen: (isContactOpen: boolean) => void

  worker: Worker | null
  setWorker: (worker: Worker | null) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  isClosing: false,
  setIsContactOpen: (isContactOpen) => {
    if (!isContactOpen) {
      set((state) => {
        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: false,
            isClosing: true
          })
        }
        return { isClosing: true }
      })

      setTimeout(() => {
        set((state) => {
          if (state.worker) {
            state.worker.postMessage({
              type: "update-contact-open",
              isContactOpen: false,
              isClosing: false
            })
          }
          return { isContactOpen: false, isClosing: false }
        })
      }, 1000)
    } else {
      set((state) => {
        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: true,
            isClosing: false
          })
        }
        return { isContactOpen: true, isClosing: false }
      })
    }
  },
  worker: null,
  setWorker: (worker) => {
    set({ worker })
  }
}))
