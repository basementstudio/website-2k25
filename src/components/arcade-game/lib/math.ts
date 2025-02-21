export const lerp = (start: number, end: number, alpha: number) => {
  return start + (end - start) * alpha;
}

export const clampLerp = (start: number, end: number, alpha: number) => {
  return lerp(start, end, clamp(alpha, 0, 1));
}

export const round = (value: number, decimals: number) => {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}

export const roundStep = (value: number, step: number) => {
  return Math.round(value / step) * step;
}

export const valueRemap = (value: number, start1: number, stop1: number, start2: number, stop2: number) => {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

export const clamp = (value: number, min: number = 0, max: number = 0) => {
  return Math.min(Math.max(value, min), max);
}

export const degToRad = (degrees: number) => {
  return degrees * (Math.PI / 180);
}

export const radToDeg = (radians: number) => {
  return radians * (180 / Math.PI);
}

export const random = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
}

export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const normalizeDelta = (delta: number) => round((1000 * delta) / 8, 4);
