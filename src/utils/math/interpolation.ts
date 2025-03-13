/**
 * Clamp a value to a range
 * @param value value to clamp
 * @param min minimum value
 * @param max maximum value
 * @returns the clamped value
 */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
/**
 * Linear interpolation
 * @param start value
 * @param end value
 * @param interpolation factor
 * @param clampValues defaults to true, clamp the result to the range [0, 1]
 * @returns the interpolated value
 */
export function lerp(a: number, b: number, t: number, clampValues = true) {
  return clampValues ? a + (b - a) * clamp(t, 0, 1) : a + (b - a) * t
}

/**
 * Map a value from one range to another
 * @param value value to map
 * @param inMin minimum value of the input range
 * @param inMax maximum value of the input range
 * @param outMin minimum value of the output range
 * @param outMax maximum value of the output range
 * @param clampValues defaults to true, clamp the result to the range [outMin, outMax]
 * @returns the mapped value
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampValues = true
) {
  const v = outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin))
  return clampValues ? clamp(v, outMin, outMax) : v
}
