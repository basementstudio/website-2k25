import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  TubeGeometry,
  Vector3
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

export const createPumpkinGeometry = () => {
  const body = new SphereGeometry(1, 48, 24)
  const positions = body.getAttribute("position")
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const angle = Math.atan2(z, x)
    const rib = 0.94 + 0.06 * Math.cos(angle * 10)
    positions.setXYZ(
      i,
      x * 0.62 * rib,
      (y + 1) * 0.5 - 0.06 * Math.pow(Math.max(0, y), 6),
      z * 0.62 * rib
    )
  }
  body.computeVertexNormals()
  const stem = new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(0, 0.92, 0),
      new Vector3(0.015, 1.04, -0.015),
      new Vector3(0.08, 1.13, -0.04)
    ]),
    6,
    0.045,
    6,
    false
  )
  const cap = new CylinderGeometry(0.08, 0.14, 0.04, 10).translate(0, 0.94, 0)
  const parts: BufferGeometry[] = [body, stem, cap]
  parts.forEach((part, i) => {
    part.deleteAttribute("uv")
    part.setAttribute(
      "aPart",
      new Float32BufferAttribute(
        new Float32Array(part.getAttribute("position").count).fill(
          i === 0 ? 0 : 1
        ),
        1
      )
    )
  })
  const geometry = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return geometry
}
