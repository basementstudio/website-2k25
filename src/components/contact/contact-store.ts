import { create } from "zustand"
import { ContactStore } from "./contact.intercace"

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  isAnimating: false,
  worker: null,

  isIntroComplete: false,
  isScaleUpComplete: false,
  isScaleDownComplete: false,
  isOutroComplete: false,
  hasBeenOpenedBefore: false,

  setWorker: (worker: Worker | null) => set({ worker }),
  setIsAnimating: (isAnimating: boolean) => set({ isAnimating }),
  setIsIntroComplete: (isComplete: boolean) =>
    set({ isIntroComplete: isComplete }),
  setIsScaleUpComplete: (isComplete: boolean) =>
    set({ isScaleUpComplete: isComplete }),
  setIsScaleDownComplete: (isComplete: boolean) =>
    set({ isScaleDownComplete: isComplete }),
  setIsOutroComplete: (isComplete: boolean) =>
    set({ isOutroComplete: isComplete }),
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) =>
    set({ hasBeenOpenedBefore }),

  setIsContactOpen: (isContactOpen: boolean) => {
    set((state: ContactStore) => {
      if (state.isAnimating) return state

      if (isContactOpen) {
        window.history.pushState(
          null,
          "",
          window.location.pathname + "#contact"
        )
      } else {
        if (window.location.hash === "#contact") {
          window.history.pushState(null, "", window.location.pathname)
        }
      }

      if (isContactOpen && !state.isContactOpen) {
        if (
          state.hasBeenOpenedBefore &&
          (!state.isOutroComplete || !state.isScaleDownComplete)
        ) {
          return state
        }

        return {
          isContactOpen,
          isIntroComplete: false,
          isScaleUpComplete: false,
          isOutroComplete: true,
          isScaleDownComplete: true,
          hasBeenOpenedBefore: true
        }
      }

      if (!isContactOpen && state.isContactOpen) {
        if (!state.isIntroComplete || !state.isScaleUpComplete) {
          return state
        }

        return {
          isContactOpen,
          isOutroComplete: false,
          isScaleDownComplete: false,
          isIntroComplete: true,
          isScaleUpComplete: true
        }
      }

      return { isContactOpen }
    })
  }
}))
