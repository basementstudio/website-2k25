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

      if (!isContactOpen) {
        let targetPath: string | null = null

        if (window.location.hash === "#contact") {
          targetPath = sessionStorage.getItem("pendingNavigation")

          window.history.pushState(
            null,
            "",
            window.location.pathname + window.location.search
          )
        }

        if (!state.isIntroComplete || !state.isScaleUpComplete) {
          return state
        }

        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: false,
            isClosing: true
          })
        }

        set({
          isOutroComplete: false,
          isScaleDownComplete: false
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
            isOutroComplete: true,
            isScaleDownComplete: true
          })

          if (targetPath && targetPath !== window.location.pathname) {
            window.dispatchEvent(
              new CustomEvent("contactFormNavigate", {
                detail: { path: targetPath }
              })
            )
            sessionStorage.removeItem("pendingNavigation")
          }
        }, 1000)

        return state
      } else {
        if (
          state.hasBeenOpenedBefore &&
          (!state.isOutroComplete || !state.isScaleDownComplete)
        ) {
          return state
        }

        if (window.location.hash !== "#contact") {
          window.history.pushState(
            null,
            "",
            window.location.pathname + window.location.search + "#contact"
          )
        }

        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: true,
            isClosing: false
          })
        }

        return {
          isContactOpen: true,
          isIntroComplete: false,
          isScaleUpComplete: false,
          isOutroComplete: true,
          isScaleDownComplete: true,
          hasBeenOpenedBefore: true
        }
      }
    })
  }
}))
