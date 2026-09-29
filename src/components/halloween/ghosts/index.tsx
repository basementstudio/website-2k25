import { useMemo, useRef } from "react"
import {
  Color,
  DoubleSide,
  Group,
  LatheGeometry,
  MathUtils,
  ShaderMaterial,
  Vector2,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { GHOSTS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

// Sheet-ghost silhouette, revolved around Y: domed head, flaring hem, 1 unit
// tall with the hem at y = 0 (the ghost's scale is its height).
const PROFILE = [
  [0, 1],
  [0.16, 0.97],
  [0.27, 0.9],
  [0.33, 0.78],
  [0.35, 0.62],
  [0.37, 0.42],
  [0.42, 0.2],
  [0.5, 0]
].map(([r, y]) => new Vector2(r, y))

const position = new Vector3()
const next = new Vector3()

// Where a ghost is along its Lissajous loop at time t.
const pathAt = (ghost: (typeof GHOSTS)[number], t: number, out: Vector3) => {
  const a = t * ghost.speed + ghost.seed * 10
  return out.set(
    ghost.center[0] + Math.sin(a) * ghost.radius[0],
    ghost.center[1] + Math.sin(a * 2.3) * 0.12,
    ghost.center[2] + Math.sin(a * 1.4 + 1) * ghost.radius[1]
  )
}

const Ghost = ({ ghost }: { ghost: (typeof GHOSTS)[number] }) => {
  const ref = useRef<Group>(null)
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(() => new LatheGeometry(PROFILE, 40), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: ghost.seed },
          uColor: { value: new Color("#d9e4ff") },
          uOpacity: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide
      }),
    [ghost.seed]
  )

  useFrameCallback((_, __, time) => {
    const group = ref.current
    if (!group) return

    pathAt(ghost, time, position)
    pathAt(ghost, time + 0.1, next)
    group.position.copy(position)
    // Face where it's drifting, leaning into the turn a little.
    const heading = Math.atan2(next.x - position.x, next.z - position.z)
    const turn = heading - group.rotation.y
    group.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * 0.08
    group.rotation.z = Math.sin(time * 0.9 + ghost.seed * 5) * 0.08

    // Fade in and out of existence every so often.
    const presence = MathUtils.smoothstep(
      Math.sin(time * 0.18 + ghost.seed * 7),
      -0.85,
      -0.35
    )
    material.uniforms.uTime.value = time
    material.uniforms.uOpacity.value =
      presence * (1 - fadeFactor.current.get() * 0.8)
  })

  return (
    <group ref={ref} scale={ghost.scale}>
      <mesh
        geometry={geometry}
        material={material}
        raycast={() => null}
        // The hem ripple pushes vertices outside the geometry's bounds.
        frustumCulled={false}
      />
    </group>
  )
}

export const HalloweenGhosts = () => (
  <>
    {GHOSTS.map((ghost) => (
      <Ghost key={ghost.seed} ghost={ghost} />
    ))}
  </>
)
