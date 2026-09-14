import { create } from "zustand"

import { ContactStore } from "./contact.interface"
import { ContactController } from "./contact-controller"

export const useContactStore = create<ContactStore>((set, get) => ({
  isContactOpen: false,
  isAnimating: false,
  controller: null,

  introCompleted: false,
  closingCompleted: true,
  hasBeenOpenedBefore: false,

  setController: (controller: ContactController | null) => set({ controller }),
  setIsAnimating: (isAnimating: boolean) => set({ isAnimating }),
  setIntroCompleted: (isComplete: boolean) =>
    set({ introCompleted: isComplete }),
  setClosingCompleted: (isComplete: boolean) =>
    set({ closingCompleted: isComplete }),
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) =>
    set({ hasBeenOpenedBefore }),

  setIsContactOpen: (isContactOpen: boolean) => {
    const state = get()
    if (state.isAnimating || state.isContactOpen === isContactOpen) return
    if (!isContactOpen && !state.introCompleted) return
    set(
      isContactOpen
        ? {
            isContactOpen: true,
            isAnimating: true,
            introCompleted: false,
            closingCompleted: false,
            hasBeenOpenedBefore: true
          }
        : { isAnimating: true, closingCompleted: false }
    )
    // Completion comes from the animation callback, rather than a timer that
    // can overwrite a subsequent opening or race with the CSS overlay.
    state.controller?.commands.emit({
      type: "update-contact-open",
      isContactOpen
    })
  }
}))
