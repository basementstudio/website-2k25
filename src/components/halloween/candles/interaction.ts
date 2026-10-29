import { MathUtils } from "three"

export const createCandleState = (seed: number) => ({
  light: 1,
  bend: 0,
  exposure: 0,
  outUntil: 0,
  smokeStartedAt: -Infinity,
  armed: true,
  direction: 1,
  relightDelay: 3 + seed * 1.8
})

export const updateCandle = (
  candle: ReturnType<typeof createCandleState>,
  hovered: boolean,
  direction: number,
  time: number,
  delta: number,
  reducedMotion: boolean
) => {
  if (!hovered) {
    candle.exposure = 0
    candle.armed = true
  } else if (candle.armed && time >= candle.outUntil && candle.light > 0.75) {
    if (direction) candle.direction = direction
    candle.exposure += delta
    if (candle.exposure >= 0.18) {
      candle.outUntil = time + candle.relightDelay
      candle.smokeStartedAt = time
      candle.armed = false
      candle.exposure = 0
    }
  }
  const lit = time >= candle.outUntil
  candle.light = MathUtils.damp(
    candle.light,
    lit ? 1 : 0,
    lit ? 3.5 : 18,
    delta
  )
  candle.bend = MathUtils.damp(
    candle.bend,
    hovered && lit && !reducedMotion ? candle.direction * 0.8 : 0,
    10,
    delta
  )
}
