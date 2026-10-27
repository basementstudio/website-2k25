import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  TorusGeometry
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// Unit pillar: base at 0, wax rim at 1. Instances set radius and height.
export const createCandleGeometry = () => {
  const parts: BufferGeometry[] = []
  const add = (geometry: BufferGeometry, hex: string) => {
    const color = new Color(hex)
    const colors = new Float32Array(geometry.getAttribute("position").count * 3)
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i)
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3))
    geometry.deleteAttribute("uv")
    parts.push(geometry)
  }
  add(new CylinderGeometry(0.94, 1, 0.96, 12).translate(0, 0.5, 0), "#e5cca0")
  add(
    new CylinderGeometry(1.2, 1.24, 0.035, 12).translate(0, 0.018, 0),
    "#47332a"
  )
  add(
    new CylinderGeometry(0.82, 0.82, 0.02, 12).translate(0, 0.97, 0),
    "#9e713e"
  )
  add(
    new TorusGeometry(0.84, 0.12, 4, 12)
      .rotateX(Math.PI / 2)
      .translate(0, 0.99, 0),
    "#f4dcac"
  )
  add(
    new CylinderGeometry(0.055, 0.07, 0.14, 5).translate(0, 1.04, 0),
    "#261811"
  )
  // Rounded wax runs, different lengths around the rim.
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.4
    const length = 0.12 + (i % 3) * 0.1
    add(
      new SphereGeometry(1, 6, 6)
        .scale(0.13, length, 0.13)
        .translate(
          Math.cos(angle) * 0.91,
          0.94 - length * 0.7,
          Math.sin(angle) * 0.91
        ),
      "#f4dcac"
    )
  }
  const geometry = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return geometry
}
