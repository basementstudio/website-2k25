import { useEffect, useMemo, useRef } from "react"
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

const COUNT = 7
const createGeometry = () => {
  const parts: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const shape = new Shape()
    const outline = [
      [0, 0.04],
      [0.17, 0.13],
      [0.37, 0.45],
      [0.68, 0.27],
      [0.53, 0.015],
      [0.37, 0.07],
      [0.27, -0.13],
      [0.17, -0.065],
      [0.07, -0.26],
      [0, -0.12]
    ]
    outline.forEach(([x, z], i) =>
      i ? shape.lineTo(x * side, z) : shape.moveTo(x * side, z)
    )
    shape.closePath()
    const wing = new ShapeGeometry(shape).rotateX(Math.PI / 2)
    wing.setAttribute(
      "aWing",
      new Float32BufferAttribute(
        new Float32Array(wing.attributes.position.count).fill(1),
        1
      )
    )
    parts.push(wing)
  }
  const body = new SphereGeometry(1, 8, 6).scale(0.055, 0.065, 0.19)
  body.setAttribute(
    "aWing",
    new Float32BufferAttribute(
      new Float32Array(body.attributes.position.count),
      1
    )
  )
  parts.push(body)
  for (const part of parts) part.deleteAttribute("uv")
  const geometry = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  geometry.setAttribute(
    "aSeed",
    new InstancedBufferAttribute(
      Float32Array.from({ length: COUNT }, (_, i) => i * 0.173),
      1
    )
  )
  return geometry
}

// A small flock beyond the Services windows; one draw, no lights/shadows.
export const HalloweenBats = () => {
  const mesh = useRef<InstancedMesh>(null)
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(createGeometry, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: DoubleSide,
        uniforms: { uTime: { value: 0 }, fadeFactor: { value: 0 } }
      }),
    []
  )
  const matrix = useMemo(() => new Matrix4(), [])
  const scale = useMemo(() => new Matrix4(), [])

  useFrameCallback((_, __, time) => {
    if (!mesh.current) return
    const local = (time + 7) % 28
    mesh.current.visible = local < 16
    material.uniforms.uTime.value = time
    material.uniforms.fadeFactor.value = fadeFactor.current.get()
    const direction = Math.floor((time + 7) / 28) % 2 === 0 ? 1 : -1
    for (let i = 0; i < COUNT; i++) {
      const size = 0.58 + (i % 3) * 0.07
      const x = -6 + local * 1.25 - i * 0.42
      matrix
        .makeRotationY(direction * Math.PI * 0.36)
        .multiply(scale.makeScale(size, size, size))
        .setPosition(
          direction > 0 ? x : 8 - x,
          2.1 + (i % 3) * 0.25 + Math.sin(time * 2.1 + i) * 0.13,
          -1.8 + (i % 2) * 0.5
        )
      mesh.current.setMatrixAt(i, matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, COUNT]}
      frustumCulled={false}
      raycast={() => null}
    />
  )
}
