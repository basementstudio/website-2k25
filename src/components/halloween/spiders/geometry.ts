import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// Spider-local space: +Z forward, +Y away from the surface, feet on y = 0,
// body length ~1 so the instance scale is the body length in world units.
// Every vertex carries the attributes the vertex shader animates with:
//   aLeg    — leg index 0..7 (0..3 left, 4..7 right), -1 body, -2 eyes
//   aHip    — the leg's pivot, where it swings from
//   aWeight — 0 at the hip → 1 at the foot, scales the step lift

const BODY = -1
const EYES = -2

// Front → back hip placement and the yaw each leg points at, measured from
// straight sideways (+ forward). Real spiders fan the front pair forward and
// the back pair backward.
const LEGS = [
  { z: 0.2, yaw: 0.95 },
  { z: 0.1, yaw: 0.35 },
  { z: 0.0, yaw: -0.25 },
  { z: -0.1, yaw: -0.8 }
]

const tag = (
  geometry: BufferGeometry,
  leg: number,
  hip: Vector3,
  weight: (y: number) => number
) => {
  const position = geometry.getAttribute("position")
  const legs = new Float32Array(position.count).fill(leg)
  const hips = new Float32Array(position.count * 3)
  const weights = new Float32Array(position.count)
  for (let i = 0; i < position.count; i++) {
    hip.toArray(hips, i * 3)
    weights[i] = weight(position.getY(i))
  }
  geometry.setAttribute("aLeg", new Float32BufferAttribute(legs, 1))
  geometry.setAttribute("aHip", new Float32BufferAttribute(hips, 3))
  geometry.setAttribute("aWeight", new Float32BufferAttribute(weights, 1))
  return geometry
}

const blob = (
  radius: [number, number, number],
  center: [number, number, number],
  detail = 10
) =>
  new SphereGeometry(1, detail, Math.round(detail * 0.75))
    .scale(...radius)
    .translate(...center)

// A thin box stretched from `a` to `b`.
const segment = (a: Vector3, b: Vector3, thickness: number) => {
  const direction = new Vector3().subVectors(b, a)
  const geometry = new BoxGeometry(thickness, thickness, direction.length())
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 0, 1),
    direction.normalize()
  )
  geometry.applyMatrix4(
    new Matrix4().compose(
      new Vector3().addVectors(a, b).multiplyScalar(0.5),
      rotation,
      new Vector3(1, 1, 1)
    )
  )
  return geometry
}

export const createSpiderGeometry = () => {
  const origin = new Vector3()
  const parts: BufferGeometry[] = [
    // Abdomen, cephalothorax, and the fangs' bump up front.
    tag(blob([0.3, 0.24, 0.38], [0, 0.3, -0.42], 12), BODY, origin, () => 0),
    tag(blob([0.19, 0.13, 0.22], [0, 0.24, 0.08]), BODY, origin, () => 0),
    tag(blob([0.07, 0.05, 0.06], [0, 0.19, 0.3], 6), BODY, origin, () => 0),
    tag(
      blob([0.035, 0.035, 0.03], [0.05, 0.3, 0.26], 6),
      EYES,
      origin,
      () => 0
    ),
    tag(
      blob([0.035, 0.035, 0.03], [-0.05, 0.3, 0.26], 6),
      EYES,
      origin,
      () => 0
    )
  ]

  LEGS.forEach(({ z, yaw }, index) => {
    for (const side of [1, -1]) {
      const hip = new Vector3(0.12 * side, 0.26, z)
      // Sideways, fanned by `yaw` toward front/back.
      const out = new Vector3(Math.cos(yaw) * side, 0, Math.sin(yaw))
      const knee = hip.clone().addScaledVector(out, 0.5).setY(0.6)
      const foot = hip.clone().addScaledVector(out, 1.1).setY(0)
      const leg = side > 0 ? index : index + 4
      // Weight by height: the foot (y 0) lifts fully, the hip (y 0.26) not
      // at all — the knee sits above the hip so clamp it.
      const weight = (y: number) => Math.min(1, Math.max(0, 1 - y / 0.26))
      parts.push(tag(segment(hip, knee, 0.045), leg, hip, weight))
      parts.push(tag(segment(knee, foot, 0.035), leg, hip, weight))
    }
  })

  // mergeGeometries wants identical attribute sets; uv isn't used.
  for (const part of parts) part.deleteAttribute("uv")
  const geometry = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  return geometry
}
