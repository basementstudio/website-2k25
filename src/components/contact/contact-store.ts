import { create } from "zustand"

import { ContactStore } from "./contact.interface"

// If the worker never acknowledges an open (chunk 404, GL context refused,
// offline), the button and Escape would otherwise latch: isAnimating stays
// true forever, or a failed open leaves isContactOpen true with
// introCompleted false so every close path early-returns behind a full-screen
// overlay. Generous: a normal intro completes well within this.
const WEDGE_GUARD_TIMEOUT = 10_000

let wedgeGuardTimeoutId: ReturnType<typeof setTimeout> | null = null

type SetState = (
  partial:
    | Partial<ContactStore>
    | ((state: ContactStore) => Partial<ContactStore>)
) => void

const armWedgeGuard = (set: SetState) => {
  if (wedgeGuardTimeoutId) clearTimeout(wedgeGuardTimeoutId)
  wedgeGuardTimeoutId = setTimeout(() => {
    wedgeGuardTimeoutId = null
    set((state) => {
      // The worker never became ready, so this open can never complete:
      // roll it back entirely instead of just clearing isAnimating.
      if (!state.workerReady && state.isContactOpen) {
        return {
          isAnimating: false,
          isContactOpen: false,
          introCompleted: false,
          closingCompleted: true
        }
      }

      return { isAnimating: false }
    })
  }, WEDGE_GUARD_TIMEOUT)
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  isAnimating: false,
  worker: null,
  workerReady: false,
  primed: false,

  introCompleted: false,
  closingCompleted: true,
  hasBeenOpenedBefore: false,

  setWorker: (worker: Worker | null) => set({ worker }),
  setIsAnimating: (isAnimating: boolean) => set({ isAnimating }),
  setWorkerReady: (workerReady: boolean) => set({ workerReady }),
  prime: () => set({ primed: true }),
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

        armWedgeGuard(set)

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

        armWedgeGuard(set)

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
