import { create } from "zustand"
import { ContactStore } from "./contact.intercace"

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
        let targetPath: string | null = null

        if (!state.introCompleted) {
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
            closingCompleted: true
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
        if (state.hasBeenOpenedBefore && !state.closingCompleted) {
          return state
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
          introCompleted: false,
          closingCompleted: true,
          hasBeenOpenedBefore: true
        }
      }
    })
  }
}))
