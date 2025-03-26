import { create } from "zustand"

import { ContactStore } from "./contact.interface"

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  isAnimating: false,
  worker: null,

  introCompleted: false,
  closingCompleted: true,
  hasBeenOpenedBefore: false,

  setWorker: (worker: Worker | null) => set({ worker }),
  setIsAnimating: (isAnimating: boolean) => set({ isAnimating }),
  setIntroCompleted: (isComplete: boolean) =>
    set({ introCompleted: isComplete }),
  setClosingCompleted: (isComplete: boolean) =>
    set({ closingCompleted: isComplete }),
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) =>
    set({ hasBeenOpenedBefore }),

  setIsContactOpen: (isContactOpen: boolean) => {
    set((state: ContactStore) => {
      if (state.isAnimating) return state

      if (!isContactOpen) {
        if (!state.introCompleted) {
          return state
        }

        if (!state.isContactOpen) {
          return state
        }

        set({ isAnimating: true })

        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: false,
            isClosing: true
          })
        }

        set({
          closingCompleted: false
        })

        setTimeout(() => {
          if (state.worker) {
            state.worker.postMessage({
              type: "update-contact-open",
              isContactOpen: false,
              isClosing: false
            })
          }

          set({
            isContactOpen: false,
            closingCompleted: true,
            isAnimating: false
          })

          document.dispatchEvent(new CustomEvent("contactClosed"))
        }, 1000)

        return { ...state, isAnimating: true }
      } else {
        if (
          state.isContactOpen ||
          (!state.closingCompleted && state.hasBeenOpenedBefore)
        ) {
          return state
        }

        set({ isAnimating: true })

        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: true,
            isClosing: false
          })
        }

        return {
          ...state,
          isContactOpen: true,
          introCompleted: false,
          closingCompleted: true,
          hasBeenOpenedBefore: true,
          isAnimating: true
        }
      }
    })
  }
}))
