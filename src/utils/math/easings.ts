export const smoothstep = (a: number, b: number, t: number) => {
  return a + (b - a) * t * t * (3 - 2 * t)
}

export const easeInOutCubic = (a: number, b: number, t: number) => {
  return a + (b - a) * (t * t * t * (t * (6 * t - 15) + 10))
}

export const easeInOutCirc = (a: number, b: number, t: number) => {
  if (t < 0.5) {
    // Ease in (first half)
    return a + (b - a) * (0.5 - Math.sqrt(0.25 - Math.pow(t, 2)))
  } else {
    // Ease out (second half)
    return a + (b - a) * (0.5 + Math.sqrt(0.25 - Math.pow(t - 1, 2)))
  }
}

export const easeInCubic = (a: number, b: number, t: number) => {
  return a + (b - a) * (t * t * t)
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

export const easeInOutCustom = (
  a: number,
  b: number,
  t: number,
  factor: number
) => {
  if (t < 0.5) {
    // Ease in (first half)
    return a + (b - a) * 0.5 * Math.pow(2 * t, factor)
  } else {
    // Ease out (second half)
    return a + (b - a) * (1 - 0.5 * Math.pow(2 * (1 - t), factor))
  }
}
