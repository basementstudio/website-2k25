import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat
} from "three"

export type PhoneAnimationName =
  | "antena"
  | "antena.003"
  | "Iddle4"
  | "Intro.001"
  | "ruedita"
  | "Outro-v2"

type AnimationType = "transition" | "idle"

interface AnimationOptions {
  type?: AnimationType
  loop?: boolean
  clampWhenFinished?: boolean
  fadeInDuration?: number
  fadeOutDuration?: number
  weight?: number
  onComplete?: () => void
}

class PhoneAnimationHandler {
  private mixer: AnimationMixer
  private clips: Map<PhoneAnimationName, AnimationClip>
  private actions: Map<PhoneAnimationName, AnimationAction>
  private onCompleteCallbacks: Map<PhoneAnimationName, () => void>
  private currentTransition: PhoneAnimationName | null = null
  private activeIdleAnimations: Set<PhoneAnimationName> = new Set()

  constructor(mixer: AnimationMixer, animations: AnimationClip[]) {
    this.mixer = mixer
    this.clips = new Map()
    this.actions = new Map()
    this.onCompleteCallbacks = new Map()

    // Register all valid animations
    animations.forEach((clip) => {
      if (this.isValidAnimationName(clip.name)) {
        this.clips.set(clip.name as PhoneAnimationName, clip)
      }
    })

    // Set up the finish listener
    this.mixer.addEventListener("finished", (e) => {
      const action = e.action
      const name = this.findAnimationNameByAction(action)

      if (name) {
        const callback = this.onCompleteCallbacks.get(name)
        if (callback) {
          callback()
          this.onCompleteCallbacks.delete(name)
        }

        // Clean up finished animations
        if (name === this.currentTransition) {
          this.currentTransition = null
        }
        this.activeIdleAnimations.delete(name)
      }
    })
  }

  private isValidAnimationName(name: string): name is PhoneAnimationName {
    return [
      "antena",
      "antena.003",
      "Iddle4",
      "Intro.001",
      "ruedita",
      "Outro-v2"
    ].includes(name)
  }

  private findAnimationNameByAction(
    action: AnimationAction
  ): PhoneAnimationName | null {
    for (const [name, registeredAction] of this.actions.entries()) {
      if (registeredAction === action) return name
    }
    return null
  }

  private getOrCreateAction(name: PhoneAnimationName): AnimationAction | null {
    if (this.actions.has(name)) {
      return this.actions.get(name)!
    }

    const clip = this.clips.get(name)
    if (!clip) {
      console.warn(`Animation clip ${name} not found`)
      return null
    }

    const action = this.mixer.clipAction(clip)
    this.actions.set(name, action)
    return action
  }

  playAnimation(
    name: PhoneAnimationName,
    options: AnimationOptions = {}
  ): AnimationAction | null {
    const {
      type = "transition",
      loop = false,
      clampWhenFinished = true,
      fadeInDuration = type === "transition" ? 0.05 : 0.2,
      fadeOutDuration = type === "transition" ? 0 : 0.2,
      weight = 1,
      onComplete
    } = options

    const action = this.getOrCreateAction(name)
    if (!action) return null

    // Configure the action
    action.reset()
    action.setLoop(loop ? LoopRepeat : LoopOnce, 1)
    action.clampWhenFinished = clampWhenFinished

    // Handle different animation types
    if (type === "transition") {
      // Stop any current transition
      if (this.currentTransition) {
        const currentAction = this.actions.get(this.currentTransition)
        if (currentAction) {
          currentAction.fadeOut(fadeOutDuration)
          currentAction.stop()
        }
      }

      // Stop all idle animations
      this.activeIdleAnimations.forEach((idleName) => {
        const idleAction = this.actions.get(idleName)
        if (idleAction) {
          idleAction.fadeOut(fadeOutDuration)
          idleAction.stop()
        }
      })
      this.activeIdleAnimations.clear()

      this.currentTransition = name
    } else {
      // For idle animations, we allow mixing
      this.activeIdleAnimations.add(name)
    }

    // Set up completion callback
    if (onComplete) {
      this.onCompleteCallbacks.set(name, onComplete)
    }

    // Play the animation
    action.setEffectiveWeight(weight)
    action.fadeIn(fadeInDuration)
    action.play()

    return action
  }

  stopAnimation(name: PhoneAnimationName, fadeOutDuration = 0.2): void {
    const action = this.actions.get(name)
    if (!action) return

    action.fadeOut(fadeOutDuration)
    setTimeout(() => {
      action.stop()
      if (name === this.currentTransition) {
        this.currentTransition = null
      }
      this.activeIdleAnimations.delete(name)
    }, fadeOutDuration * 1000)
  }

  stopAllAnimations(fadeOutDuration = 0.2): void {
    // Stop transition animation
    if (this.currentTransition) {
      this.stopAnimation(this.currentTransition, fadeOutDuration)
    }

    // Stop all idle animations
    this.activeIdleAnimations.forEach((name) => {
      this.stopAnimation(name, fadeOutDuration)
    })

    this.activeIdleAnimations.clear()
    this.currentTransition = null
  }

  update(deltaTime: number): void {
    this.mixer.update(deltaTime)
  }
}

export { PhoneAnimationHandler }
