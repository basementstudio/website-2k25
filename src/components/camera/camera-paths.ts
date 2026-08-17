import * as THREE from "three"

/**
 * Hand-authored waypoints that thread scene-to-scene camera transitions
 * through the office's open space instead of straight through geometry.
 *
 * Coordinates are world-space and validated offline by raycasting the
 * sampled Catmull-Rom curve (plus ±0.25m offset lines) against the office
 * and officeItems GLBs. Constraints that shaped them: the mezzanine slab
 * at y=3.7 (x<5.6), the hall beam at z≈-11.4 (y 4.0-4.3), the east ledge
 * at x≈9.6-10.3, the hanging light field over the north upper floor
 * (x≥3.7, z≤-17.3, y 5.3-6.7) and the desks below it (tops at y≈4.9) —
 * people-bound paths run the open corridor at x≈3.15 between the library
 * wall and the lights. Re-validate here if the map geometry changes.
 *
 * Routes are looked up in both directions (reversed when needed); pairs
 * without an entry fly the straight lerp, which is verified clear.
 */
const PATHS: Record<string, [number, number, number][]> = {
  "home->showcase": [[6.9, 3.3, -11.4]],
  "home->people": [
    [6.4, 2.2, -10.6],
    [5.9, 4.7, -13.8],
    [4.2, 5.1, -16.5],
    [3.15, 5.55, -20.0],
    [3.15, 5.55, -25.0]
  ],
  "home->blog": [
    [7.6, 2.4, -11.0],
    [8.3, 5.2, -14.2],
    [10.3, 5.0, -15.8]
  ],
  "blog->people": [
    [10.4, 5.0, -22.0],
    [8.3, 5.0, -25.0],
    [5.0, 5.15, -26.6]
  ],
  "showcase->people": [
    [4.3, 5.05, -16.4],
    [3.15, 5.55, -20.0],
    [3.15, 5.55, -25.0]
  ]
}

export const getTransitionWaypoints = (
  from: string,
  to: string
): THREE.Vector3[] | null => {
  const direct = PATHS[`${from}->${to}`]
  if (direct) return direct.map((p) => new THREE.Vector3(...p))
  const reversed = PATHS[`${to}->${from}`]
  if (reversed) return reversed.map((p) => new THREE.Vector3(...p)).reverse()
  return null
}

/**
 * Build the flight curve for a transition, or null when a straight lerp
 * should be used. Waypoints that are further from the destination than the
 * start point are dropped — when a navigation interrupts a flight mid-air
 * the camera is already past them and detouring back looks wrong.
 */
export const buildTransitionCurve = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  waypoints: THREE.Vector3[]
): THREE.CatmullRomCurve3 | null => {
  const startToEnd = start.distanceTo(end)
  if (startToEnd < 1e-3) return null

  const usable = waypoints.filter((w) => w.distanceTo(end) < startToEnd)
  if (usable.length === 0) return null

  const curve = new THREE.CatmullRomCurve3(
    [start.clone(), ...usable, end.clone()],
    false,
    "centripetal"
  )
  // Precompute the arc-length table now so getPointAt() is cheap per frame.
  curve.getLength()
  return curve
}
