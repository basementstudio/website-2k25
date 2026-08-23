export interface ContactStore {
  isContactOpen: boolean
  isAnimating: boolean
  worker: Worker | null
  workerReady: boolean
  primed: boolean

  introCompleted: boolean
  closingCompleted: boolean
  hasBeenOpenedBefore: boolean

  setWorker: (worker: Worker | null) => void
  setIsAnimating: (isAnimating: boolean) => void
  setWorkerReady: (workerReady: boolean) => void
  prime: () => void
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
