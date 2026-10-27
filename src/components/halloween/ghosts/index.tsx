import { useMemo, useRef } from "react"
import {
  BackSide,
  BufferGeometry,
  Color,
  FrontSide,
  Group,
  LatheGeometry,
  MathUtils,
  Points,
  ShaderMaterial,
  SplineCurve,
  Vector2,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { GHOSTS, STREET_GHOSTS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import frag from "./frag.glsl"
import { createTrailGeometry, createTrailMaterial, emitWisps } from "./trail"
import vert from "./vert.glsl"

// A sheet draped over a rounded head: shoulders fall into a loose, open
// skirt, with enough fabric at the hem for the wind to catch.
const PROFILE = [
  [0, 1],
  [0.085, 0.985],
  [0.15, 0.94],
  [0.175, 0.85],
  [0.235, 0.73],
  [0.26, 0.61],
  [0.28, 0.43],
  [0.32, 0.22],
  [0.38, 0]
].map(([r, y]) => new Vector2(r, y))
// Smoothed and densified: the folds and torn hem are shaped in the vertex
// shader, so the robe needs rows to bend.
const SMOOTH_PROFILE = new SplineCurve(PROFILE).getPoints(48)

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
      ghost.y * 0.5 + Math.sin(t * 1.7 + ghost.seed * 9) * 0.15,
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
const velocity = new Vector3()
const cameraRight = new Vector3()
const middle = new Vector3()
const closest = new Vector3()
const away = new Vector3()

// Startled by the cursor: how far from the ghost's middle (in heights) the
// cursor ray has to pass, how hard it shoves the ghost away, and the spring
// pulling it back onto its path.
const DODGE_RADIUS = 0.7
const DODGE_PUSH = 60
const DODGE_SPRING = 7
const DODGE_DAMPING = 3.5
const DODGE_MAX = 1.2

interface GhostProps {
  path: GhostPath
  scale: number
  seed: number
  glow?: number
}

const Ghost = ({ path, scale, seed, glow = 1 }: GhostProps) => {
  const ref = useRef<Group>(null)
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(() => new LatheGeometry(SMOOTH_PROFILE, 64), [])
  // The far side of the robe is drawn first, then the near side over it —
  // with a single double-sided pass, half the face ends up behind the back.
  const [uniforms, inside, outside] = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uColor: { value: new Color("#cbd0d4").multiplyScalar(glow) },
      uOpacity: { value: 0 },
      uLightFlicker: lightFlickerUniform,
      uLightning: lightningUniform
    }
    const [inside, outside] = [BackSide, FrontSide].map(
      (side) =>
        new ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms,
          transparent: true,
          depthWrite: false,
          side
        })
    )
    return [uniforms, inside, outside] as const
  }, [seed, glow])
  const trailRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const trailGeometry = useMemo(createTrailGeometry, [])
  const trailMaterial = useMemo(() => createTrailMaterial(glow), [glow])
  const dodge = useMemo(
    () => ({ offset: new Vector3(), velocity: new Vector3() }),
    []
  )

  useFrameCallback((state, delta, time) => {
    const group = ref.current
    if (!group) return
    const { camera } = state

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

    // The cursor passing close shoves it off its path; a spring brings it
    // back once the cursor's gone.
    state.raycaster.setFromCamera(state.pointer, camera)
    middle.copy(position).add(dodge.offset)
    middle.y += scale * 0.72
    state.raycaster.ray.closestPointToPoint(middle, closest)
    const reach = scale * DODGE_RADIUS
    const near = 1 - Math.min(closest.distanceTo(middle) / reach, 1)
    if (near > 0 && presence > 0.2) {
      away.subVectors(middle, closest)
      if (away.lengthSq() < 1e-6)
        away.setFromMatrixColumn(camera.matrixWorld, 0)
      dodge.velocity.addScaledVector(
        away.normalize(),
        near * DODGE_PUSH * scale * delta
      )
    }
    dodge.velocity
      .addScaledVector(dodge.offset, -DODGE_SPRING * delta)
      .multiplyScalar(Math.exp(-DODGE_DAMPING * delta))
    dodge.offset
      .addScaledVector(dodge.velocity, delta)
      .clampLength(0, scale * DODGE_MAX)
    group.position.copy(position).add(dodge.offset)
    // Always turned to stare at whoever's watching...
    const heading = Math.atan2(
      camera.position.x - position.x,
      camera.position.z - position.z
    )
    const turn = heading - group.rotation.y
    group.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * 0.08
    // ...and leaning into the drift, as seen from the camera.
    velocity.subVectors(next, position).divideScalar(0.1).add(dodge.velocity)
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
    const lean = MathUtils.clamp(-velocity.dot(cameraRight) * 0.25, -0.3, 0.3)
    group.rotation.z = MathUtils.lerp(
      group.rotation.z,
      lean + Math.sin(time * 0.9 + seed * 5) * 0.06,
      0.05
    )

    const opacity = (1 - fadeFactor.current.get() * 0.8) * 0.7
    uniforms.uTime.value = time
    uniforms.uOpacity.value = presence * opacity

    const trail = trailRef.current
    if (trail) {
      emitWisps(trail, group.position, scale, presence, delta, time)
      trail.material.uniforms.uOpacity.value = opacity
      state.gl.getDrawingBufferSize(trail.material.uniforms.uResolution.value)
    }
  })

  return (
    <>
      {/* World space: the wisps stay where they were dropped. */}
      <points
        ref={trailRef}
        geometry={trailGeometry}
        material={trailMaterial}
        renderOrder={-1}
        raycast={() => null}
        frustumCulled={false}
      />
      <group ref={ref} scale={[scale, scale * 1.3, scale * 0.85]}>
        {[inside, outside].map((material, i) => (
          <mesh
            key={i}
            geometry={geometry}
            material={material}
            renderOrder={i - 1}
            raycast={() => null}
            // The hem ripple pushes vertices outside the geometry's bounds.
            frustumCulled={false}
          />
        ))}
      </group>
    </>
  )
}

const ROOM_PATHS = GHOSTS.map((ghost) => ({
  ...ghost,
  path: roomPath(ghost),
  glow: 1
}))
const STREET_PATHS = STREET_GHOSTS.map((ghost) => ({
  ...ghost,
  scale: ghost.scale * 0.7,
  path: streetPath(ghost),
  glow: 1.15
}))

export const HalloweenGhosts = () => (
  <>
    {[...ROOM_PATHS, ...STREET_PATHS].map(({ path, scale, seed, glow }) => (
      <Ghost key={seed} path={path} scale={scale} seed={seed} glow={glow} />
    ))}
  </>
)
