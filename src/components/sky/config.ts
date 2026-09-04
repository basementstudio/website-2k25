import { Vector3 } from "three"

export const SKY_LUT_WIDTH = 256
export const SKY_LUT_HEIGHT = 128

// Big backdrop sphere drawn first and overdrawn by everything; comfortably
// behind the outdoor set (buildings billboard at z≈105, old sky at z≈82-87).
export const SKY_SPHERE_RADIUS = 300
export const SKY_SPHERE_CENTER: [number, number, number] = [0, 5, 0]

/**
 * Maps real compass azimuth into scene space: 0 puts north at scene +z — the
 * office window view. The southern-hemisphere sun arcs east→north→west, so
 * with north out the window the whole real arc stays visible.
 */
export const SKY_YAW_OFFSET_DEG = 0

/** Weather lerp horizon in seconds (store holds raw targets). */
export const WEATHER_SMOOTH_SECONDS = 3

/** Re-bake the LUT once the sun has moved this far (~35s of real time). */
export const BAKE_SUN_ANGLE_COS = Math.cos((0.15 * Math.PI) / 180)
export const BAKE_CLOUD_DELTA = 0.01
export const BAKE_RAIN_DELTA = 0.02
export const BAKE_MIN_INTERVAL_S = 0.1

// CPU-side copies of the atmosphere constants in lut-fragment.glsl — used to
// march sun transmittance for the disc color without any GPU readback.
export const ATMOSPHERE = {
  RG: 6371,
  RT: 6471,
  HR: 8,
  HM: 1.2,
  BETA_R: [0.0058, 0.0135, 0.0331] as const,
  BETA_M_EXT: 0.00333,
  BETA_O: [0.00065, 0.00188, 0.00008] as const
}

const TINT_STOPS: { el: number; color: [number, number, number] }[] = [
  { el: -12, color: [0.13, 0.15, 0.25] },
  { el: -6, color: [0.45, 0.42, 0.55] },
  { el: 0, color: [1.05, 0.85, 0.65] },
  { el: 15, color: [1, 1, 1] }
]

/** Sun-elevation ramp for the outdoor set: night blue → twilight → golden → day. */
export const outdoorTintForElevation = (elevationDeg: number, out: Vector3) => {
  const stops = TINT_STOPS
  if (elevationDeg <= stops[0].el) return out.fromArray(stops[0].color)
  const last = stops[stops.length - 1]
  if (elevationDeg >= last.el) return out.fromArray(last.color)

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (elevationDeg <= b.el) {
      const t = (elevationDeg - a.el) / (b.el - a.el)
      return out.set(
        a.color[0] + (b.color[0] - a.color[0]) * t,
        a.color[1] + (b.color[1] - a.color[1]) * t,
        a.color[2] + (b.color[2] - a.color[2]) * t
      )
    }
  }
  return out.fromArray(last.color)
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
