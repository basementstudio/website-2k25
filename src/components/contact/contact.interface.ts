import { ContactController } from "./contact-controller"
export interface ContactStore {
  isContactOpen: boolean
  isAnimating: boolean
  controller: ContactController | null

  introCompleted: boolean
  closingCompleted: boolean
  hasBeenOpenedBefore: boolean

  setController: (controller: ContactController | null) => void
  setIsAnimating: (isAnimating: boolean) => void
  setIntroCompleted: (isComplete: boolean) => void
  setClosingCompleted: (isComplete: boolean) => void
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) => void
  setIsContactOpen: (isContactOpen: boolean) => void
}

export const ANIMATION_TYPES = {
  IDLE: "idle",
  INTRO: "intro",
  BUTTON: "button",
  OUTRO: "outro",
  RUEDITA: "ruedita",
  ANTENA: "antena"
}
