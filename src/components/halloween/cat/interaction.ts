import { MathUtils } from "three"

export const createCatInteraction = () => ({
  yaw: 0,
  pitch: 0,
  blink: 0,
  blinkStartedAt: -Infinity,
  nextBlinkAt: 3.5,
  blinkCount: 0,
  swipe: 0,
  swipeStartedAt: -Infinity,
  nextSwipeAt: 0,
  swipeSide: 1,
  wasHovered: false
})

export const updateCatInteraction = (
  state: ReturnType<typeof createCatInteraction>,
  time: number,
  delta: number,
  lookYaw: number,
  lookPitch: number,
  hovered: boolean,
  side: number,
  reducedMotion: boolean
) => {
  state.yaw = MathUtils.damp(
    state.yaw,
    reducedMotion ? 0 : MathUtils.clamp(lookYaw, -0.48, 0.48),
    5,
    delta
  )
  state.pitch = MathUtils.damp(
    state.pitch,
    reducedMotion ? 0 : MathUtils.clamp(lookPitch, -0.22, 0.22),
    5,
    delta
  )
  if (time >= state.nextBlinkAt) {
    state.blinkStartedAt = time
    state.blinkCount++
    state.nextBlinkAt =
      time +
      (state.blinkCount % 4 === 0
        ? 0.34
        : 4.8 + (0.5 + 0.5 * Math.sin(time * 3.73)) * 3)
  }
  const blinkAge = (time - state.blinkStartedAt) / 0.2
  state.blink =
    blinkAge >= 0 && blinkAge <= 1 ? Math.sin(blinkAge * Math.PI) ** 2 : 0
  if (
    hovered &&
    !state.wasHovered &&
    time >= state.nextSwipeAt &&
    !reducedMotion
  ) {
    state.swipeStartedAt = time
    state.nextSwipeAt = time + 1.6
    state.swipeSide = side < 0 ? -1 : 1
  }
  state.wasHovered = hovered
  const swipeAge = (time - state.swipeStartedAt) / 0.7
  state.swipe = swipeAge >= 0 && swipeAge <= 1 ? swipeAge : 0
}
