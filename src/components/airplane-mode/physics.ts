import { Box3, Mesh, Object3D, Ray, Triangle, Vector3 } from "three"

export const FLIGHT_GATES: [number, number, number][] = [
  [5.83, 3.52, -12],
  [4, 4.8, -16],
  [4, 4.8, -24],
  [10.5, 4.8, -26],
  [10.5, 4.8, -18],
  [10, 3.5, -11],
  [6, 3.52, -9.5]
]
export const PLANE_RADIUS = 0.16

// Heading (matches the plane's yaw convention: yaw 0 faces -Z) that points
// `from` straight at `to`, ignoring pitch.
export function yawTowards(from: Vector3, to: Vector3) {
  return Math.atan2(from.x - to.x, from.z - to.z)
}

// Wall hit response (flight.tsx): instead of mirroring the heading off the
// wall — a head-on hit then spun the plane (and the rigidly mounted GoPro)
// ~180° — steer it along the wall, angled slightly away from it. A graze
// barely changes course; a head-on hit turns ~110° toward `turnBias`'s side
// (the player's current bank, so it breaks the way they were already
// leaning). `severity` is 0 for a graze and 1 for head-on, and scales how
// hard the hit brakes and shakes. `yaw` is null for floors/ceilings, where
// the heading shouldn't change at all.
const DEFLECT_AWAY = 0.35
export function wallDeflection(
  velocity: Vector3,
  normal: Vector3,
  turnBias = 0
) {
  const speed = velocity.length()
  const severity = speed > 0 ? Math.max(0, -velocity.dot(normal) / speed) : 1
  if (Math.abs(normal.y) >= 0.7) return { severity, yaw: null }
  const wall = new Vector3(normal.x, 0, normal.z).normalize()
  const along = new Vector3(velocity.x, 0, velocity.z)
  along.addScaledVector(wall, -along.dot(wall))
  if (along.lengthSq() < 1e-4 * speed * speed) {
    // Dead-on: no "along" to follow, pick a side of the wall.
    along.set(-wall.z, 0, wall.x)
    if (turnBias < 0) along.negate()
  }
  along.normalize().addScaledVector(wall, DEFLECT_AWAY)
  return { severity, yaw: Math.atan2(-along.x, -along.z) }
}

// Keep Blender world transforms: this collider is authored against the office.
// Do not center or normalize it as we do for the plane's display geometry.
export function createFlightCollider(root: Object3D) {
  root.updateMatrixWorld(true)
  const triangles: Triangle[] = []
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const { geometry, matrixWorld } = object
    const position = geometry.getAttribute("position")
    const index = geometry.getIndex()
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const vertices = [0, 1, 2].map((offset) =>
        new Vector3()
          .fromBufferAttribute(
            position,
            index ? index.getX(i + offset) : i + offset
          )
          .applyMatrix4(matrixWorld)
      )
      triangles.push(new Triangle(vertices[0], vertices[1], vertices[2]))
    }
  })
  const bounds = new Box3().setFromObject(root).expandByScalar(0.1)
  const nearest = new Vector3(),
    direction = new Vector3(),
    hit = new Vector3(),
    normal = new Vector3()
  const ray = new Ray()
  return {
    triangles,
    bounds,
    collides(from: Vector3, to: Vector3, radius = PLANE_RADIUS) {
      if (!bounds.containsPoint(to)) return true
      direction.subVectors(to, from)
      const distance = direction.length()
      ray.set(from, direction.normalize())
      return triangles.some((triangle) => {
        triangle.closestPointToPoint(to, nearest)
        if (nearest.distanceToSquared(to) < radius * radius) return true
        return (
          distance > 0 &&
          ray.intersectTriangle(
            triangle.a,
            triangle.b,
            triangle.c,
            false,
            hit
          ) !== null &&
          hit.distanceToSquared(from) <= distance * distance
        )
      })
    },
    // Same sweep as collides, but returns the surface normal of whichever
    // triangle actually stopped the plane, so flight.tsx can bounce off it
    // instead of stopping dead. Null out-of-bounds (there's no wall there —
    // the caller falls back to reflecting straight back the way it came).
    collisionNormal(from: Vector3, to: Vector3, radius = PLANE_RADIUS) {
      if (!bounds.containsPoint(to)) return null
      direction.subVectors(to, from)
      const distance = direction.length()
      ray.set(from, direction.normalize())
      for (const triangle of triangles) {
        triangle.closestPointToPoint(to, nearest)
        const penetrating = nearest.distanceToSquared(to) < radius * radius
        const swept =
          distance > 0 &&
          ray.intersectTriangle(
            triangle.a,
            triangle.b,
            triangle.c,
            false,
            hit
          ) !== null &&
          hit.distanceToSquared(from) <= distance * distance
        if (penetrating || swept) {
          triangle.getNormal(normal)
          // Face the normal back toward the approach direction — a
          // back-facing triangle (hit from "inside", e.g. a thin wall swept
          // through in one step) would otherwise reflect the plane deeper
          // into the surface instead of away from it.
          if (normal.dot(direction) > 0) normal.negate()
          return normal
        }
      }
      return null
    },
    // Spring-arm probe (Unreal's USpringArmComponent): how far from `from`
    // toward `to` a sphere of `radius` can travel before touching the
    // collider. Approximated with the center ray plus four rays offset by
    // `radius` around it — plenty for a camera boom against the collider's
    // big flat walls, and far cheaper than a real sphere sweep.
    sweepDistance(from: Vector3, to: Vector3, radius: number) {
      direction.subVectors(to, from)
      const length = direction.length()
      if (length === 0) return 0
      direction.divideScalar(length)
      sweepSide.crossVectors(direction, WORLD_UP)
      if (sweepSide.lengthSq() < 1e-6) sweepSide.set(1, 0, 0)
      sweepSide.normalize()
      sweepUp.crossVectors(sweepSide, direction).normalize()
      // A hit up to `radius` past the end still touches the sphere there.
      let nearestHit = Infinity
      for (const [side, up] of SWEEP_OFFSETS) {
        sweepOrigin
          .copy(from)
          .addScaledVector(sweepSide, side * radius)
          .addScaledVector(sweepUp, up * radius)
        ray.set(sweepOrigin, direction)
        for (const triangle of triangles) {
          if (
            ray.intersectTriangle(
              triangle.a,
              triangle.b,
              triangle.c,
              false,
              hit
            ) === null
          )
            continue
          const distance = hit.distanceTo(sweepOrigin)
          if (distance < nearestHit && distance < length + radius)
            nearestHit = distance
        }
      }
      if (nearestHit === Infinity) return length
      return Math.min(length, Math.max(0, nearestHit - radius))
    }
  }
}

const WORLD_UP = new Vector3(0, 1, 0)
const SWEEP_OFFSETS: [number, number][] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
]
const sweepSide = new Vector3()
const sweepUp = new Vector3()
const sweepOrigin = new Vector3()

export function crossesGate(
  from: Vector3,
  to: Vector3,
  center: Vector3,
  normal: Vector3,
  radius = 0.65
) {
  const fromDistance =
    (from.x - center.x) * normal.x +
    (from.y - center.y) * normal.y +
    (from.z - center.z) * normal.z
  const toDistance =
    (to.x - center.x) * normal.x +
    (to.y - center.y) * normal.y +
    (to.z - center.z) * normal.z

  // Count arrival at the ring plane once, but not motion along it or a
  // nearby pass that stays on the same side.
  if (fromDistance === 0 || fromDistance * toDistance > 0) return false
  const t = fromDistance / (fromDistance - toDistance)
  return (
    Math.hypot(
      from.x + (to.x - from.x) * t - center.x,
      from.y + (to.y - from.y) * t - center.y,
      from.z + (to.z - from.z) * t - center.z
    ) < radius
  )
}
