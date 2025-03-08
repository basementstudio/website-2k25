export const smoothstep = (a: number, b: number, t: number) => {
  return a + (b - a) * t * t * (3 - 2 * t)
}

export const easeInOutCubic = (a: number, b: number, t: number) => {
  return a + (b - a) * (t * t * t * (t * (6 * t - 15) + 10))
}

export const easeOutCubic = (a: number, b: number, t: number) => {
  return a + (b - a) * (1 - (1 - t) * (1 - t) * (1 - t))
}

export const easeOutCustom = (
  a: number,
  b: number,
  t: number,
  factor: number
) => {
  return a + (b - a) * (1 - Math.pow(1 - t, factor))
}
