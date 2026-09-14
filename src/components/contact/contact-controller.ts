type Size = { width: number; height: number }
type Point = { x: number; y: number; z: number }
export type ContactCommand = {
  type:
    | "update-contact-open"
    | "run-outro-animation"
    | "submit-clicked"
    | "window-resize"
    | "scale-animation-complete"
    | "scale-down-animation-complete"
    | "start-outro"
  isContactOpen?: boolean
  isClosing?: boolean
  windowDimensions?: Size
}
export type AnimationPhase =
  | "animation-starting"
  | "animation-complete"
  | "animation-rejected"
  | "intro-complete"
  | "outro-complete"
  | "start-outro"
  | "scale-animation-complete"
  | "scale-down-animation-complete"
  | "ruedita-animation-start"
  | "ruedita-animation-complete"
  | "antena-animation-start"
  | "antena-animation-complete"
  | "button-animation-start"
  | "button-animation-complete"
export type ContactEvent =
  | {
      type: AnimationPhase
      currentState?: boolean
      screenPos?: never
      dimensions?: never
    }
  | {
      type: "update-screen-skinned-matrix"
      screenPos: Point
      scale: number
      dimensions?: never
    }
  | { type: "screen-dimensions"; dimensions: Size; screenPos?: never }

/** Synchronous, typed callbacks: no worker, message serialization, or per-frame React state. */
class Callbacks<T> {
  private callbacks = new Set<(value: T) => void>()
  emit(value: T) {
    for (const callback of this.callbacks) callback(value)
  }
  subscribe(callback: (value: T) => void) {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }
}
export class ContactController {
  readonly commands = new Callbacks<ContactCommand>()
  readonly events = new Callbacks<ContactEvent>()
}
