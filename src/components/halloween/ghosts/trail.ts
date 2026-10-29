import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3
} from "three"

import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import frag from "./trail-frag.glsl"
import vert from "./trail-vert.glsl"

// Wisps shed from the hem: each lives this many seconds, drifting up and
// fading, and stays where it was dropped — so a moving ghost leaves a trail.
const LIFE = 1.8
const PER_SECOND = 14
const COUNT = Math.ceil(LIFE * PER_SECOND) + 4

// A ring buffer of wisps. `emitWisps` drops new ones under the ghost; the
// shader animates them from their birth time, so nothing else is touched per
// frame.
export const createTrailGeometry = () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(COUNT * 3), 3)
  )
  geometry.setAttribute(
    // Born long ago: every slot starts dead.
    "aBirth",
    new Float32BufferAttribute(new Float32Array(COUNT).fill(-1e3), 1)
  )
  geometry.setAttribute(
    "aPresence",
    new Float32BufferAttribute(new Float32Array(COUNT), 1)
  )
  geometry.setAttribute(
    "aSeed",
    new Float32BufferAttribute(
      Float32Array.from({ length: COUNT }, () => Math.random()),
      1
    )
  )
  geometry.userData.trail = { next: 0, owed: 0 }
  return geometry
}

export const createTrailMaterial = (glow: number) =>
  new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uLife: { value: LIFE },
      uScale: { value: 1 },
      uResolution: { value: new Vector2(1, 1) },
      uColor: { value: new Color("#9c7ec7").multiplyScalar(glow * 0.5) },
      uOpacity: { value: 1 },
      uLightFlicker: lightFlickerUniform,
      uLightning: lightningUniform
    },
    transparent: true,
    depthWrite: false
  })

// Works on the rendered Points itself (not on whatever a hook closed over),
// so the wisps always land in the buffers that are actually on screen.
export const emitWisps = (
  points: Points<BufferGeometry, ShaderMaterial>,
  position: Vector3,
  scale: number,
  presence: number,
  delta: number,
  time: number
) => {
  const { geometry, material } = points
  const s = geometry.userData.trail as { next: number; owed: number }
  s.owed += delta * PER_SECOND
  const spawn = geometry.getAttribute("position")
  const birth = geometry.getAttribute("aBirth")
  const present = geometry.getAttribute("aPresence")
  while (s.owed >= 1) {
    s.owed -= 1
    // Somewhere around the hem.
    const angle = Math.random() * Math.PI * 2
    const radius = MathUtils.randFloat(0.06, 0.2) * scale
    spawn.setXYZ(
      s.next,
      position.x + Math.cos(angle) * radius,
      position.y + MathUtils.randFloat(-0.05, 0.15) * scale,
      position.z + Math.sin(angle) * radius
    )
    birth.setX(s.next, time)
    present.setX(s.next, presence)
    s.next = (s.next + 1) % COUNT
  }
  spawn.needsUpdate = true
  birth.needsUpdate = true
  present.needsUpdate = true
  material.uniforms.uTime.value = time
  material.uniforms.uScale.value = scale
}
