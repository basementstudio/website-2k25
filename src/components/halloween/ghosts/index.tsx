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
import { GHOSTS, STREET_GHOSTS } from "@/constants/halloween"
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

// A ghost's route: writes its position at time t into `out` and returns how
// present it is (0 = invisible, 1 = fully there).
type GhostPath = (t: number, out: Vector3) => number

// Indoors: a Lissajous loop, fading in and out of existence every so often.
const roomPath =
  (ghost: (typeof GHOSTS)[number]): GhostPath =>
  (t, out) => {
    const a = t * ghost.speed + ghost.seed * 10
    out.set(
      ghost.center[0] + Math.sin(a) * ghost.radius[0],
      ghost.center[1] + Math.sin(a * 2.3) * 0.12,
      ghost.center[2] + Math.sin(a * 1.4 + 1) * ghost.radius[1]
    )
    return MathUtils.smoothstep(
      Math.sin(t * 0.18 + ghost.seed * 7),
      -0.85,
      -0.35
    )
  }

// Outside: drifts down the street from one end to the other, then waits
// off-screen before the next pass.
const streetPath =
  (ghost: (typeof STREET_GHOSTS)[number]): GhostPath =>
  (t, out) => {
    const [from, to] = ghost.x
    const travel = Math.abs(to - from) / ghost.speed
    const cycle = travel + ghost.wait
    const local = (t + ghost.seed * cycle) % cycle
    const progress = Math.min(local / travel, 1)
    out.set(
      MathUtils.lerp(from, to, progress),
      ghost.y + Math.sin(t * 1.7 + ghost.seed * 9) * 0.15,
      ghost.z + Math.sin(t * 0.6 + ghost.seed * 4) * 0.4
    )
    // Fade in/out over the first and last tenth of the pass.
    return local > travel
      ? 0
      : Math.min(
          MathUtils.smoothstep(progress, 0, 0.1),
          1 - MathUtils.smoothstep(progress, 0.9, 1)
        )
  }

const position = new Vector3()
const next = new Vector3()

interface GhostProps {
  path: GhostPath
  scale: number
  seed: number
  glow?: number
}

const Ghost = ({ path, scale, seed, glow = 1 }: GhostProps) => {
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
          uSeed: { value: seed },
          uColor: { value: new Color("#d9e4ff").multiplyScalar(glow) },
          uOpacity: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide
      }),
    [seed, glow]
  )

  useFrameCallback(({ camera }, __, time) => {
    const group = ref.current
    if (!group) return

    // Paths cross other sections' cameras (the Home loops pass right
    // through the Services camera): vanish before filling the screen.
    const presence =
      path(time, position) *
      MathUtils.smoothstep(
        position.distanceTo(camera.position),
        scale * 1.5,
        scale * 3.5
      )
    path(time + 0.1, next)
    group.position.copy(position)
    // Face where it's drifting, leaning into the turn a little.
    const heading = Math.atan2(next.x - position.x, next.z - position.z)
    const turn = heading - group.rotation.y
    group.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * 0.08
    group.rotation.z = Math.sin(time * 0.9 + seed * 5) * 0.08

    material.uniforms.uTime.value = time
    material.uniforms.uOpacity.value =
      presence * (1 - fadeFactor.current.get() * 0.8)
  })

  return (
    <group ref={ref} scale={scale}>
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

const ROOM_PATHS = GHOSTS.map((ghost) => ({
  ...ghost,
  path: roomPath(ghost),
  glow: 1
}))
const STREET_PATHS = STREET_GHOSTS.map((ghost) => ({
  ...ghost,
  path: streetPath(ghost),
  glow: 1.8
}))

export const HalloweenGhosts = () => (
  <>
    {[...ROOM_PATHS, ...STREET_PATHS].map(({ path, scale, seed, glow }) => (
      <Ghost key={seed} path={path} scale={scale} seed={seed} glow={glow} />
    ))}
  </>
)
