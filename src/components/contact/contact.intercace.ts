export interface ContactStore {
  isContactOpen: boolean
  isAnimating: boolean
  worker: Worker | null

  isIntroComplete: boolean
  isScaleUpComplete: boolean
  isScaleDownComplete: boolean
  isOutroComplete: boolean
  hasBeenOpenedBefore: boolean

  setWorker: (worker: Worker | null) => void
  setIsAnimating: (isAnimating: boolean) => void
  setIsIntroComplete: (isComplete: boolean) => void
  setIsScaleUpComplete: (isComplete: boolean) => void
  setIsScaleDownComplete: (isComplete: boolean) => void
  setIsOutroComplete: (isComplete: boolean) => void
  setHasBeenOpenedBefore: (hasBeenOpenedBefore: boolean) => void
  setIsContactOpen: (isContactOpen: boolean) => void
}
