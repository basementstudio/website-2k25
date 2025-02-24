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
  private mixer: AnimationMixer // Three.js animation system
  private clips: Map<PhoneAnimationName, AnimationClip> // Stores animation data
  private actions: Map<PhoneAnimationName, AnimationAction> // Stores playable animations
  private onCompleteCallbacks: Map<PhoneAnimationName, () => void> // Completion callbacks
  private currentTransition: PhoneAnimationName | null = null // Currently playing transition
  private activeIdleAnimations: Set<PhoneAnimationName> = new Set() // Currently playing idle animations

  /**
   * Initializes the animation handler with a mixer and animation clips
   * @param mixer - Three.js AnimationMixer instance
   * @param animations - Array of animation clips from the 3D model
   */
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

    /**
     * Event listener for animation completion
     * Handles cleanup and triggers callbacks when animations finish
     */
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

  /**
   * Validates if a given animation name is one of the supported animations
   * @param name - Name to validate
   * @returns True if the name is a valid animation name
   */
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

  /**
   * Finds the animation name associated with a given AnimationAction
   * Used for mapping Three.js animation actions back to our named animations
   * @param action - The AnimationAction to look up
   * @returns The animation name or null if not found
   */
  private findAnimationNameByAction(
    action: AnimationAction
  ): PhoneAnimationName | null {
    for (const [name, registeredAction] of this.actions.entries()) {
      if (registeredAction === action) return name
    }
    return null
  }

  /**
   * Gets an existing AnimationAction or creates a new one for the given animation
   * @param name - Name of the animation
   * @returns The AnimationAction or null if the animation doesn't exist
   */
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

  /**
   * Plays an animation with the specified options
   * Handles both transition and idle animations differently:
   * - Transition animations: Stop other animations and play exclusively
   * - Idle animations: Can blend with other idle animations
   *
   * @param name - Name of the animation to play
   * @param options - Configuration options for playback
   * @returns The created AnimationAction or null if animation not found
   */
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

  /**
   * Stops a specific animation with a fade out
   * @param name - Name of the animation to stop
   * @param fadeOutDuration - Duration of the fade out in seconds
   */
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

  /**
   * Stops all currently playing animations
   * @param fadeOutDuration - Duration of the fade out in seconds
   */
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

  /**
   * Updates the animation system
   * Must be called every frame in the render loop
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.mixer.update(deltaTime)
  }
}

export { PhoneAnimationHandler }
