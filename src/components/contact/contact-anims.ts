import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat
} from "three"

/**
 * Defines the valid animation names for the phone model.
 * These correspond to the actual animation clips in the 3D model.
 */
export type PhoneAnimationName =
  | "antena"
  | "antena.003"
  | "Iddle4"
  | "Intro.001"
  | "ruedita"
  | "Outro-v2"

/**
 * Defines the type of animation:
 * - 'transition': One-shot animations that transition between states
 * - 'idle': Continuous animations that can loop and blend with others
 */
type AnimationType = "transition" | "idle"

/**
 * Configuration options for playing animations
 */
interface AnimationOptions {
  type?: AnimationType // Whether this is a transition or idle animation
  loop?: boolean // Should the animation loop
  clampWhenFinished?: boolean // Keep the final frame when animation ends
  fadeInDuration?: number // Duration of fade-in transition
  fadeOutDuration?: number // Duration of fade-out transition
  weight?: number // Animation influence weight (for blending)
  onComplete?: () => void // Callback when animation completes
}

/**
 * Handles the playback and management of phone model animations.
 * Provides functionality for:
 * - Playing and stopping individual animations
 * - Managing transitions between animations
 * - Handling animation blending and weights
 * - Coordinating multiple simultaneous animations
 */
class PhoneAnimationHandler {
  private mixer: AnimationMixer
  private clips: Map<PhoneAnimationName, AnimationClip>
  private actions: Map<PhoneAnimationName, AnimationAction>
  private onCompleteCallbacks: Map<PhoneAnimationName, () => void>
  private currentAnimation: AnimationAction | null = null

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

    this.mixer.addEventListener("finished", (e) => {
      const name = this.findAnimationNameByAction(e.action)
      if (name) {
        const callback = this.onCompleteCallbacks.get(name)
        if (callback) {
          callback()
          this.onCompleteCallbacks.delete(name)
        }
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
      weight = 1,
      onComplete
    } = options

    const newAction = this.getOrCreateAction(name)
    if (!newAction) return null

    if (newAction === this.currentAnimation) return newAction

    newAction.reset()
    newAction.setLoop(loop ? LoopRepeat : LoopOnce, 1)
    newAction.clampWhenFinished = clampWhenFinished
    newAction.setEffectiveWeight(weight)

    if (this.currentAnimation) {
      newAction.crossFadeFrom(this.currentAnimation, 0.3, true)
    }

    if (onComplete) {
      this.onCompleteCallbacks.set(name, onComplete)
    }

    newAction.play()
    this.currentAnimation = newAction

    return newAction
  }

  update(deltaTime: number): void {
    this.mixer.update(deltaTime)
  }
}

export { PhoneAnimationHandler }
