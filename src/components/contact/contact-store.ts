import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
  isAnimating: boolean
  setIsAnimating: (isAnimating: boolean) => void

  isIntroComplete: boolean
  setIsIntroComplete: (isComplete: boolean) => void
  isScaleUpComplete: boolean
  setIsScaleUpComplete: (isComplete: boolean) => void
  isScaleDownComplete: boolean
  setIsScaleDownComplete: (isComplete: boolean) => void
  isOutroComplete: boolean
  setIsOutroComplete: (isComplete: boolean) => void
  hasBeenOpenedBefore: boolean
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) => void

  worker: Worker | null
  setWorker: (worker: Worker | null) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => {
    set((state) => {
      if (state.isAnimating) {
        return state
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
  },
  isAnimating: false,
  setIsAnimating: (isAnimating) => {
    set({ isAnimating })
  },

  // Animation completion state
  isIntroComplete: false,
  setIsIntroComplete: (isComplete) => {
    set({ isIntroComplete: isComplete })
  },
  isScaleUpComplete: false,
  setIsScaleUpComplete: (isComplete) => {
    set({ isScaleUpComplete: isComplete })
  },
  isScaleDownComplete: false,
  setIsScaleDownComplete: (isComplete) => {
    set({ isScaleDownComplete: isComplete })
  },
  isOutroComplete: false,
  setIsOutroComplete: (isComplete) => {
    set({ isOutroComplete: isComplete })
  },
  hasBeenOpenedBefore: false,
  setHasBeenOpenedBefore: (hasBeenOpenedBefore) => {
    set({ hasBeenOpenedBefore })
  },

  worker: null,
  setWorker: (worker) => {
    set({ worker })
  }
}))
