export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation
 * @param start value
 * @param end value
 * @param interpolation factor
 * @param clampValuedefaults to true, clamp the result to the range [a, b]
 * @returns the interpolated value
 */
export function lerp(
  a: number,
  b: number,
  t: number,
  clampValues: boolean = true
) {
  return clampValues ? a + (b - a) * clamp(t, 0, 1) : a + (b - a) * t
}

export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampValues: boolean = true
) {
  const v = outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin))
  return clampValues ? clamp(v, outMin, outMax) : v
}
