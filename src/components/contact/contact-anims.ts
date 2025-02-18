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

interface AnimationOptions {
  loop?: boolean
  clampWhenFinished?: boolean
  fadeInDuration?: number
  fadeOutDuration?: number
  speed?: number
  onComplete?: () => void
}

class PhoneAnimationHandler {
  private mixer: AnimationMixer
  private animations: Map<PhoneAnimationName, AnimationClip>
  private activeActions: Map<PhoneAnimationName, AnimationAction>
  private onCompleteCallbacks: Map<PhoneAnimationName, () => void>

  constructor(mixer: AnimationMixer, animations: AnimationClip[]) {
    this.mixer = mixer
    this.animations = new Map()
    this.activeActions = new Map()
    this.onCompleteCallbacks = new Map()

    animations.forEach((clip) => {
      if (this.isValidAnimationName(clip.name)) {
        this.animations.set(clip.name as PhoneAnimationName, clip)
      }
    })

    this.mixer.addEventListener("finished", (e) => {
      const action = e.action
      const animName = Array.from(this.activeActions.entries()).find(
        ([_, a]) => a === action
      )?.[0]

      if (animName) {
        const callback = this.onCompleteCallbacks.get(animName)
        if (callback) {
          callback()
          this.onCompleteCallbacks.delete(animName)
        }
      }
    })
  }

  private isValidAnimationName(name: string): name is PhoneAnimationName {
    return [
      "IN",
      "antena",
      "antena.003",
      "Idle4",
      "Intro.001",
      "ruedita"
    ].includes(name)
  }

  playAnimation(
    name: PhoneAnimationName,
    options: AnimationOptions = {}
  ): AnimationAction | null {
    const {
      loop = false,
      clampWhenFinished = false,
      fadeInDuration = 0.2,
      fadeOutDuration = 0.2,
      speed = 1,
      onComplete
    } = options

    const clip = this.animations.get(name)
    if (!clip) {
      console.warn(`Animation ${name} not found`)
      return null
    }

    this.stopAnimation(name)

    const action = this.mixer.clipAction(clip)
    action.setLoop(loop ? LoopRepeat : LoopOnce, 1)
    action.clampWhenFinished = clampWhenFinished
    action.fadeIn(fadeInDuration)
    action.timeScale = speed

    if (onComplete) {
      this.onCompleteCallbacks.set(name, onComplete)
    }

    this.activeActions.set(name, action)
    action.play()

    return action
  }

  stopAnimation(name: PhoneAnimationName, fadeOutDuration = 0.2): void {
    const action = this.activeActions.get(name)
    if (action) {
      action.fadeOut(fadeOutDuration)
      setTimeout(() => {
        action.stop()
        this.activeActions.delete(name)
      }, fadeOutDuration * 1000)
    }
  }

  stopAllAnimations(fadeOutDuration = 0.2): void {
    this.activeActions.forEach((_, name) => {
      this.stopAnimation(name, fadeOutDuration)
    })
  }

  isPlaying(name: PhoneAnimationName): boolean {
    return this.activeActions.has(name)
  }

  setSpeed(name: PhoneAnimationName, speed: number): void {
    const action = this.activeActions.get(name)
    if (action) {
      action.timeScale = speed
    }
  }

  crossFade(
    fromName: PhoneAnimationName,
    toName: PhoneAnimationName,
    duration = 0.2
  ): void {
    const fromAction = this.activeActions.get(fromName)
    const toClip = this.animations.get(toName)

    if (!fromAction || !toClip) {
      console.warn("One or both animations not found for crossfade")
      return
    }

    const toAction = this.mixer.clipAction(toClip)
    fromAction.fadeOut(duration)
    toAction.fadeIn(duration)
    toAction.play()

    this.activeActions.delete(fromName)
    this.activeActions.set(toName, toAction)
  }

  update(deltaTime: number): void {
    this.mixer.update(deltaTime)
  }

  playSequence(
    animations: Array<{ name: PhoneAnimationName; options?: AnimationOptions }>,
    onAllComplete?: () => void
  ): void {
    if (animations.length === 0) {
      onAllComplete?.()
      return
    }

    const playNext = (index: number) => {
      if (index >= animations.length) {
        onAllComplete?.()
        return
      }

      const { name, options = {} } = animations[index]
      this.playAnimation(name, {
        ...options,
        onComplete: () => {
          playNext(index + 1)
          options.onComplete?.()
        }
      })
    }

    playNext(0)
  }
}

export { PhoneAnimationHandler }
