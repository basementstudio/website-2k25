import { create } from "zustand"

import { ContactStore } from "./contact.interface"

// If the scene never acknowledges an open (chunk 404, GL context refused,
// offline), the button and Escape latch: isAnimating stays true forever, or a
// failed open leaves isContactOpen true with introCompleted false so every
// close path early-returns behind a full-screen overlay. Wall-clock rather
// than lib/canvas-boot's visible-time budget, which is one-shot per page load
// and so cannot be re-armed per open.
const CONTACT_OPEN_TIMEOUT_MS = 10_000

let openTimeoutId: ReturnType<typeof setTimeout> | null = null

const disarmOpenTimeout = () => {
  if (!openTimeoutId) return
  clearTimeout(openTimeoutId)
  openTimeoutId = null
}

const armOpenTimeout = () => {
  disarmOpenTimeout()
  openTimeoutId = setTimeout(() => {
    openTimeoutId = null

    const { sceneReady, isContactOpen } = useContactStore.getState()
    // Without a scene there is nothing to animate or close, so roll the open
    // back rather than only releasing isAnimating. introCompleted is already
    // false and closingCompleted already true on that path.
    const rollBack = !sceneReady && isContactOpen

    useContactStore.setState({
      isAnimating: false,
      ...(rollBack && { isContactOpen: false })
    })

    // use-handle-navigation parks a route on this event while contact is open.
    // A nav click during a failed open finds setIsContactOpen(false) blocked by
    // the isAnimating guard, so without this the route never resumes.
    if (rollBack) document.dispatchEvent(new CustomEvent("contactClosed"))
  }, CONTACT_OPEN_TIMEOUT_MS)
}

export const useContactStore = create<ContactStore>((set, get) => ({
  isContactOpen: false,
  isAnimating: false,
  worker: null,
  sceneReady: false,
  primed: false,

  introCompleted: false,
  closingCompleted: true,
  hasBeenOpenedBefore: false,

  setWorker: (worker: Worker | null) => set({ worker }),
  setIsAnimating: (isAnimating: boolean) => {
    if (!isAnimating) disarmOpenTimeout()
    set({ isAnimating })
  },
  setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
  // Latches, and fires on every hover: without the guard each pointer enter
  // notifies every subscriber for a value that never changes again.
  prime: () => {
    if (!get().primed) set({ primed: true })
  },
  setIntroCompleted: (isComplete: boolean) =>
    set({ introCompleted: isComplete }),
  setClosingCompleted: (isComplete: boolean) =>
    set({ closingCompleted: isComplete }),

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

        armOpenTimeout()

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

          disarmOpenTimeout()

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

        armOpenTimeout()

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
          // Opening without a prior hover (keyboard, deep link) still has to
          // mount the canvas, and primed is the single gate that does it.
          primed: true,
          introCompleted: false,
          closingCompleted: true,
          hasBeenOpenedBefore: true,
          isAnimating: true
        }
      }
    })
  }
}))
