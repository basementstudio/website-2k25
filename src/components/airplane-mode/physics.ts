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

// The two wingtip vertices, in the "Plane" mesh's own local space (decoded
// straight from the GLB's Draco-compressed geometry: the mirrored corners of
// the vertex cluster skinned to Bone_L01/Bone_L02). Read as children of the
// mesh node so their world position tracks the fuselage without depending on
// the model's axis/rotation conventions.
export const WING_TIPS: [[number, number, number], [number, number, number]] = [
  [5.756100177764893, 3.5267457962036133, -9.548337936401367],
  [5.756100177764893, 3.5405533313751221, -9.405926704406738]
]

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
    }
  }
}

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
