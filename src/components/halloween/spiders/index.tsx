import { useMemo, useRef } from "react"
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Plane,
  ShaderMaterial,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import {
  SPIDER_FLEE_RADIUS,
  SPIDER_FLEE_SPEED,
  SPIDER_SCALE,
  SPIDER_SPEED,
  SPIDER_SURFACES
} from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import frag from "./frag.glsl"
import { createSpiderGeometry } from "./geometry"
import vert from "./vert.glsl"

// Keep feet just off the surface so they never z-fight with it.
const SURFACE_OFFSET = 0.004
// Gait cycles per body length walked — higher = faster little legs.
const STEPS_PER_LENGTH = 2.2
// How close to a patch edge (in body lengths) a spider starts turning back.
const EDGE_MARGIN = 3

interface Surface {
  center: Vector3
  normal: Vector3
  u: Vector3
  v: Vector3
  half: [number, number]
  plane: Plane
}

interface Spider {
  surface: number
  u: number
  v: number
  heading: number
  turn: number
  speed: number
  targetSpeed: number
  timer: number
  walking: boolean
  scale: number
  phase: number
}

const buildSurfaces = (): Surface[] =>
  SPIDER_SURFACES.map((s) => {
    const normal = new Vector3(...s.normal).normalize()
    const u = new Vector3(...s.tangent).normalize()
    const v = new Vector3().crossVectors(normal, u).normalize()
    const center = new Vector3(...s.center)
    return {
      center,
      normal,
      u,
      v,
      half: [s.size[0] / 2, s.size[1] / 2],
      plane: new Plane().setFromNormalAndCoplanarPoint(normal, center)
    }
  })

const buildSpiders = (surfaces: Surface[]): Spider[] =>
  SPIDER_SURFACES.flatMap((s, surface) =>
    Array.from({ length: s.count }, () => {
      const [hu, hv] = surfaces[surface].half
      return {
        surface,
        u: MathUtils.randFloatSpread(hu * 1.6),
        v: MathUtils.randFloatSpread(hv * 1.6),
        heading: Math.random() * Math.PI * 2,
        turn: 0,
        speed: 0,
        targetSpeed: 0,
        timer: Math.random() * 3,
        walking: false,
        scale: MathUtils.randFloat(...SPIDER_SCALE),
        phase: Math.random() * Math.PI * 2
      }
    })
  )

// Shortest signed angle from a to b.
const angleDelta = (a: number, b: number) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a))

export const HalloweenSpiders = () => {
  const meshRef = useRef<InstancedMesh>(null)
  const { fadeFactor } = useFadeAnimation()

  const surfaces = useMemo(buildSurfaces, [])
  const spiders = useMemo(() => buildSpiders(surfaces), [surfaces])
  const geometry = useMemo(() => {
    const geometry = createSpiderGeometry()
    geometry.setAttribute(
      "aPhase",
      new InstancedBufferAttribute(new Float32Array(spiders.length), 1)
    )
    geometry.setAttribute(
      "aSeed",
      new InstancedBufferAttribute(
        Float32Array.from(spiders, () => Math.random()),
        1
      )
    )
    return geometry
  }, [spiders])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uColor: { value: new Color("#141011") },
          uEyeColor: { value: new Color("#ff2a12") },
          uStride: { value: 0.32 },
          uLift: { value: 0.12 },
          fadeFactor: { value: 0 }
        }
      }),
    []
  )

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      forward: new Vector3(),
      right: new Vector3(),
      scale: new Vector3(),
      hit: new Vector3(),
      local: new Vector3(),
      // Per-surface cursor hit, in the surface's (u, v); null when the
      // cursor ray misses the patch.
      cursor: surfaces.map(() => null as [number, number] | null)
    }),
    [surfaces]
  )

  useFrameCallback((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    material.uniforms.fadeFactor.value = fadeFactor.current.get()

    const { matrix, position, forward, right, scale, hit, local, cursor } =
      scratch

    // One ray-plane test per patch is all the cursor tracking costs.
    state.raycaster.setFromCamera(state.pointer, state.camera)
    surfaces.forEach((surface, i) => {
      cursor[i] = null
      if (!state.raycaster.ray.intersectPlane(surface.plane, hit)) return
      local.subVectors(hit, surface.center)
      const cu = local.dot(surface.u)
      const cv = local.dot(surface.v)
      const [hu, hv] = surface.half
      if (
        Math.abs(cu) <= hu + SPIDER_FLEE_RADIUS &&
        Math.abs(cv) <= hv + SPIDER_FLEE_RADIUS
      )
        cursor[i] = [cu, cv]
    })

    const phases = geometry.getAttribute("aPhase") as InstancedBufferAttribute

    spiders.forEach((spider, i) => {
      const surface = surfaces[spider.surface]
      const [hu, hv] = surface.half

      // Walk in bursts: dash, freeze, dash — the thing that makes them read
      // as spiders rather than bugs on rails.
      spider.timer -= delta
      if (spider.timer <= 0) {
        spider.walking = !spider.walking || Math.random() < 0.25
        spider.timer = spider.walking
          ? MathUtils.randFloat(0.4, 2.2)
          : MathUtils.randFloat(0.6, 3.5)
        spider.targetSpeed = spider.walking
          ? MathUtils.randFloat(...SPIDER_SPEED)
          : 0
        if (spider.walking) spider.heading += MathUtils.randFloatSpread(1.6)
      }

      // Cursor close by: bolt straight away from it.
      const c = cursor[spider.surface]
      if (c) {
        const du = spider.u - c[0]
        const dv = spider.v - c[1]
        if (du * du + dv * dv < SPIDER_FLEE_RADIUS * SPIDER_FLEE_RADIUS) {
          spider.walking = true
          spider.timer = Math.max(spider.timer, 0.5)
          spider.targetSpeed = SPIDER_FLEE_SPEED
          spider.heading +=
            angleDelta(spider.heading, Math.atan2(dv, du)) *
            Math.min(1, delta * 12)
        }
      }

      // Wander: the turn rate itself random-walks, so paths curve instead
      // of jittering.
      spider.turn += MathUtils.randFloatSpread(14) * delta
      spider.turn *= Math.exp(-delta * 3)
      spider.heading += spider.turn * delta

      // Near an edge: steer back toward the middle of the patch.
      const margin = spider.scale * EDGE_MARGIN
      if (
        Math.abs(spider.u) > hu - margin ||
        Math.abs(spider.v) > hv - margin
      ) {
        const home = Math.atan2(-spider.v, -spider.u)
        spider.heading +=
          angleDelta(spider.heading, home) * Math.min(1, delta * 4)
      }

      spider.speed = MathUtils.damp(
        spider.speed,
        spider.targetSpeed,
        spider.targetSpeed > spider.speed ? 14 : 20,
        delta
      )
      const step = spider.speed * delta
      spider.u = MathUtils.clamp(
        spider.u + Math.cos(spider.heading) * step,
        -hu,
        hu
      )
      spider.v = MathUtils.clamp(
        spider.v + Math.sin(spider.heading) * step,
        -hv,
        hv
      )
      spider.phase += (step / spider.scale) * STEPS_PER_LENGTH * Math.PI * 2
      phases.setX(i, spider.phase)

      position
        .copy(surface.center)
        .addScaledVector(surface.u, spider.u)
        .addScaledVector(surface.v, spider.v)
        .addScaledVector(surface.normal, SURFACE_OFFSET)
      forward
        .copy(surface.u)
        .multiplyScalar(Math.cos(spider.heading))
        .addScaledVector(surface.v, Math.sin(spider.heading))
      right.crossVectors(surface.normal, forward)
      matrix.makeBasis(right, surface.normal, forward)
      matrix.scale(scale.setScalar(spider.scale))
      matrix.setPosition(position)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    phases.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, spiders.length]}
      // Instances span the whole office; the geometry's own bounds would
      // cull them all the moment the origin leaves the frustum.
      frustumCulled={false}
      raycast={() => null}
    />
  )
}
