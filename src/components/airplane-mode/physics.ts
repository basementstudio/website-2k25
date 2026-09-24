import {
  Box3,
  CatmullRomCurve3,
  Line,
  Mesh,
  Object3D,
  Ray,
  Triangle,
  Vector3
} from "three"

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

// Free flight's idle autopilot tour (flight.tsx), from Nico's path.glb: a
// closed loop drawn in Blender as a line mesh (edges only, 2 per vertex).
// Walks the edges into an ordered loop in world space and smooths it into a
// closed Catmull-Rom curve, pre-sampled by arc length so the autopilot can
// find its place on it cheaply every frame.
export function createFlightPath(root: Object3D, samples = 512) {
  root.updateMatrixWorld(true)
  // GLTFLoader turns a LINES primitive into LineSegments, not a Mesh.
  let line: Line | Mesh | undefined
  root.traverse((object) => {
    if (!line && (object instanceof Line || object instanceof Mesh))
      line = object
  })
  const position = line?.geometry.getAttribute("position")
  const index = line?.geometry.getIndex()
  if (!line || !position || !index || position.count < 3) return null

  const neighbours = new Map<number, number[]>()
  for (let i = 0; i < index.count; i += 2) {
    const a = index.getX(i),
      b = index.getX(i + 1)
    neighbours.set(a, [...(neighbours.get(a) ?? []), b])
    neighbours.set(b, [...(neighbours.get(b) ?? []), a])
  }
  const order = [0]
  let previous = -1,
    current = 0
  for (let guard = 0; guard < position.count; guard++) {
    const next = neighbours.get(current)?.find((n) => n !== previous)
    if (next === undefined || next === 0) break
    order.push(next)
    previous = current
    current = next
  }
  const matrix = line.matrixWorld
  const points = order
    .map((i) =>
      new Vector3().fromBufferAttribute(position, i).applyMatrix4(matrix)
    )
    // Blender leaves the odd doubled vertex — drop near-duplicates, they
    // make Catmull-Rom kink.
    .filter((point, i, all) => i === 0 || point.distanceTo(all[i - 1]) > 0.02)

  const curve = new CatmullRomCurve3(points, true, "centripetal")
  const spaced = curve.getSpacedPoints(samples).slice(0, samples)
  return {
    curve,
    points: spaced,
    length: curve.getLength(),
    // Nearest sample index to `point`. With `around`, only searches a
    // window of samples around that index (cheap per-frame tracking).
    nearest(point: Vector3, around?: number, window = 24) {
      let best = around ?? 0
      let bestDistance = Infinity
      const from = around === undefined ? 0 : around - window
      const to = around === undefined ? samples : around + window
      for (let i = from; i < to; i++) {
        const wrapped = ((i % samples) + samples) % samples
        const distance = spaced[wrapped].distanceToSquared(point)
        if (distance < bestDistance) {
          bestDistance = distance
          best = wrapped
        }
      }
      return best
    },
    at(sample: number) {
      return spaced[((Math.round(sample) % samples) + samples) % samples]
    }
  }
}
export type FlightPath = NonNullable<ReturnType<typeof createFlightPath>>

// Autopilot steering toward `target`, as the same -1…1 horizontal/vertical
// inputs the keys produce (flight.tsx feeds them through the normal flight
// model). Shared with physics.test.ts's lap simulation.
const AUTOPILOT_TURN_GAIN = 1.6
const AUTOPILOT_CLIMB_GAIN = 1.5
// Offsets the constant sink between boosts.
const AUTOPILOT_CLIMB_BIAS = 0.2
export function autopilotSteer(
  position: Vector3,
  yaw: number,
  target: Vector3
) {
  const desired = yawTowards(position, target)
  const headingError = Math.atan2(
    Math.sin(desired - yaw),
    Math.cos(desired - yaw)
  )
  const clamp = (v: number) => Math.min(1, Math.max(-1, v))
  return {
    horizontal: clamp(-headingError * AUTOPILOT_TURN_GAIN),
    vertical: clamp(
      (target.y - position.y) * AUTOPILOT_CLIMB_GAIN + AUTOPILOT_CLIMB_BIAS
    )
  }
}

// Heading (matches the plane's yaw convention: yaw 0 faces -Z) that points
// `from` straight at `to`, ignoring pitch.
export function yawTowards(from: Vector3, to: Vector3) {
  return Math.atan2(from.x - to.x, from.z - to.z)
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
  radius = 0.65
) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    dz = to.z - from.z
  const length = dx * dx + dy * dy + dz * dz
  const t =
    length === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((center.x - from.x) * dx +
              (center.y - from.y) * dy +
              (center.z - from.z) * dz) /
              length
          )
        )
  return (
    Math.hypot(
      from.x + dx * t - center.x,
      from.y + dy * t - center.y,
      from.z + dz * t - center.z
    ) < radius
  )
}
