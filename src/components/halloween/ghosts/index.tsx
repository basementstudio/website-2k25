import { MeshDiscardMaterial, useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  type Object3D,
  Plane,
  Points,
  ShaderMaterial,
  type Texture,
  Vector2,
  Vector3
} from "three"

import { useAssets } from "@/components/assets-provider"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { GHOSTS, STREET_GHOSTS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import { useHalloweenPointer } from "../use-pointer"
import frag from "./frag.glsl"
import { createGhostRig } from "./rig"
import { createTrailGeometry, createTrailMaterial, emitWisps } from "./trail"
import { useGhostGrab } from "./use-ghost-grab"
import vert from "./vert.glsl"

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
const cameraDirection = new Vector3()
const pointerPlane = new Plane()

interface GhostProps {
  source: Object3D
  path: GhostPath
  scale: number
  seed: number
  glow?: number
  reducedMotion: boolean
}

const Ghost = ({
  source,
  path,
  scale,
  seed,
  glow = 1,
  reducedMotion
}: GhostProps) => {
  const ref = useRef<Group>(null)
  const pointer = useHalloweenPointer()
  const { fadeFactor } = useFadeAnimation()
  // Render both sides without writing depth so overlapping folds blend
  // as translucent fabric instead of cutting hard patches into the sheet.
  const [uniforms, material] = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uColor: { value: new Color("#c6a5ed").multiplyScalar(glow * 1.65) },
      uOpacity: { value: 0 },
      uPointer: { value: new Vector2(0, 0.45) },
      uHover: { value: 0 },
      uDrag: { value: new Vector2() },
      uTouchMotion: { value: reducedMotion ? 0 : 1 },
      uGrab: { value: 0 },
      uClothMap: { value: null as Texture | null },
      uLightFlicker: lightFlickerUniform,
      uLightning: lightningUniform
    }
    const material = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: DoubleSide
    })
    return [uniforms, material] as const
  }, [seed, glow, reducedMotion])
  const grab = useGhostGrab(
    ref,
    scale,
    () =>
      uniforms.uOpacity.value > 0.2 &&
      fadeFactor.current.get() < 0.1 &&
      !useNavigationStore.getState().isCameraTransitioning
  )
  const trailRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const rig = useMemo(
    () => createGhostRig(source, [material]),
    [source, material]
  )
  const springs = useRef<ReturnType<typeof rig.start> | null>(null)
  useEffect(() => {
    const simulation = rig.start()
    springs.current = simulation
    return () => {
      simulation.dispose()
      springs.current = null
      rig.mesh.geometry.dispose()
      rig.mesh.skeleton.dispose()
      rig.materials.forEach((material) => material.dispose())
    }
  }, [rig])
  const trailGeometry = useMemo(createTrailGeometry, [])
  const trailMaterial = useMemo(() => createTrailMaterial(glow), [glow])
  const hovering = useRef(false)
  const dragTarget = useMemo(() => new Vector2(), [])

  useFrameCallback((state, delta, time) => {
    const group = ref.current
    if (!group) return
    const { camera } = state

    // Paths cross other sections' cameras (the Home loops pass right
    // through the Services camera): vanish before filling the screen.
    const routePresence = path(time, position)
    path(time + 0.1, next)
    grab.follow(position, delta)
    const influence = Math.max(
      grab.state.weight,
      Math.min(1, grab.state.offset.length() / scale)
    )
    const presence =
      MathUtils.lerp(routePresence, 1, influence) *
      MathUtils.smoothstep(
        group.position.distanceTo(camera.position),
        scale * 1.5,
        scale * 3.5
      )
    // Always turned to stare at whoever's watching...
    const heading = Math.atan2(
      camera.position.x - group.position.x,
      camera.position.z - group.position.z
    )
    const turn = heading - group.rotation.y
    if (!grab.state.active)
      group.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - Math.exp(-4 * delta))
    // ...and leaning into the drift, as seen from the camera.
    velocity.subVectors(next, position).divideScalar(0.1)
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
    const lean = MathUtils.clamp(-velocity.dot(cameraRight) * 0.12, -0.1, 0.1)
    if (!grab.state.active)
      group.rotation.z = MathUtils.lerp(
        group.rotation.z,
        lean + Math.sin(time * 0.9 + seed * 5) * 0.025,
        1 - Math.exp(-3 * delta)
      )
    group.updateMatrixWorld(true)
    springs.current?.update(delta, reducedMotion ? 0 : grab.state.weight)
    uniforms.uGrab.value = grab.state.weight

    // Project onto a camera-facing plane through the cloth, then work in
    // garment coordinates. Hover affects only the shader, never the route.
    let hover = 0
    dragTarget.set(0, 0)
    if (grab.state.active) {
      hover = 1
      uniforms.uPointer.value.set(
        grab.state.localPoint.x,
        grab.state.localPoint.y
      )
      group.worldToLocal(closest.copy(grab.state.hit))
      dragTarget
        .set(
          closest.x - grab.state.localPoint.x,
          closest.y - grab.state.localPoint.y
        )
        .clampLength(0, 0.16)
    } else if (pointer.active && presence > 0.2) {
      state.raycaster.setFromCamera(pointer.position, camera)
      group.localToWorld(middle.set(0, 0.5, 0))
      camera.getWorldDirection(cameraDirection)
      pointerPlane.setFromNormalAndCoplanarPoint(cameraDirection, middle)
      if (state.raycaster.ray.intersectPlane(pointerPlane, closest)) {
        group.worldToLocal(closest)
        const radius = rig.radiusAt(closest.y)
        hover =
          MathUtils.smoothstep(closest.y, -0.14, 0) *
          (1 - MathUtils.smoothstep(closest.y, 0.96, 1.04)) *
          (1 - MathUtils.smoothstep(Math.abs(closest.x), radius, radius + 0.06))
        if (hover > 0.01) {
          if (!hovering.current) {
            uniforms.uPointer.value.set(closest.x, closest.y)
            uniforms.uDrag.value.set(0, 0)
          } else {
            // The cloth caught under the hand lags behind the stroke.
            // A bounded tangential pull complements the local indentation.
            dragTarget
              .set(
                closest.x - uniforms.uPointer.value.x,
                closest.y - uniforms.uPointer.value.y
              )
              .multiplyScalar(1.8)
              .clampLength(0, 0.1)
            const follow = 1 - Math.exp(-16 * delta)
            uniforms.uPointer.value.x = MathUtils.lerp(
              uniforms.uPointer.value.x,
              closest.x,
              follow
            )
            uniforms.uPointer.value.y = MathUtils.lerp(
              uniforms.uPointer.value.y,
              closest.y,
              follow
            )
          }
        }
      }
    }
    hovering.current = hover > 0.01
    grab.setHovered(hover > 0.1)
    uniforms.uHover.value = MathUtils.damp(
      uniforms.uHover.value,
      hover,
      hover > uniforms.uHover.value ? 8 : 3.5,
      delta
    )
    uniforms.uDrag.value.lerp(dragTarget, 1 - Math.exp(-6 * delta))

    const opacity = (1 - fadeFactor.current.get() * 0.8) * 0.95
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
      <group ref={ref} scale={scale * 1.3}>
        <primitive object={rig.object} />
        <mesh
          name="ghost-grab-surface"
          geometry={rig.mesh.geometry}
          dispose={null}
        >
          <MeshDiscardMaterial />
        </mesh>
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

export const HalloweenGhosts = ({
  reducedMotion
}: {
  reducedMotion: boolean
}) => {
  const { specialEvents } = useAssets()
  const { scene } = useGLTF(specialEvents.halloween.ghost, false)
  return (
    <>
      {[...ROOM_PATHS, ...STREET_PATHS].map(({ path, scale, seed, glow }) => (
        <Ghost
          key={seed}
          source={scene}
          path={path}
          scale={scale}
          seed={seed}
          glow={glow}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  )
}
