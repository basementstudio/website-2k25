import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import {
  AdditiveBlending,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { CANDLE_CLUSTERS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import { useHalloweenPointer } from "../use-pointer"
import bodyFrag from "./body-frag.glsl"
import bodyVert from "./body-vert.glsl"
import flameFrag from "./flame-frag.glsl"
import flameVert from "./flame-vert.glsl"
import { createCandleGeometry } from "./geometry"
import { createCandleState, updateCandle } from "./interaction"
import poolFrag from "./pool-frag.glsl"
import poolVert from "./pool-vert.glsl"
import smokeFrag from "./smoke-frag.glsl"
import smokeVert from "./smoke-vert.glsl"

// Three pillars in a loose triangle; shelf groups rotate the long axis into Z.
const PILLARS = [
  { x: -0.14, z: -0.025 },
  { x: 0.02, z: 0.035 },
  { x: 0.15, z: -0.01 }
]
const SHAPES = [
  { height: 0.34, radius: 0.044, tint: [1.04, 1.02, 0.96] },
  { height: 0.19, radius: 0.067, tint: [0.9, 0.84, 0.94] },
  { height: 0.095, radius: 0.055, tint: [1.02, 0.88, 0.68] }
]

// Four draws for all candles: wax, flames, surface glows and brief smoke.
// No dynamic lights or shadows: the office uses baked lighting.
export const HalloweenCandles = ({
  reducedMotion
}: {
  reducedMotion: boolean
}) => {
  const bodies = useRef<InstancedMesh>(null)
  const flames = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)
  const smoke = useRef<InstancedMesh>(null)
  const { fadeFactor } = useFadeAnimation()
  const pointer = useHalloweenPointer()
  const candles = useMemo(
    () =>
      CANDLE_CLUSTERS.flatMap((cluster, clusterIndex) =>
        PILLARS.map((pillar, i) => {
          const c = Math.cos(cluster.rotation)
          const s = Math.sin(cluster.rotation)
          const depth = cluster.name.includes("shelf") ? 0.4 : 1
          const shape = SHAPES[(i + clusterIndex) % SHAPES.length]
          const seed = (((clusterIndex * 0.618 + i * 0.37) % 1) + 1) % 1
          return {
            x:
              cluster.position[0] +
              (pillar.x * c - pillar.z * depth * s) * cluster.scale,
            y: cluster.position[1] + 0.003,
            z:
              cluster.position[2] +
              (pillar.x * s + pillar.z * depth * c) * cluster.scale,
            height: shape.height * (0.92 + seed * 0.16) * cluster.scale,
            radius: shape.radius * cluster.scale,
            rotation: cluster.rotation + seed * Math.PI * 2,
            tint: shape.tint,
            seed
          }
        })
      ),
    []
  )
  const interaction = useMemo(
    () => candles.map((candle) => createCandleState(candle.seed)),
    [candles]
  )
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      sphere: new Sphere(),
      hit: new Vector3(),
      previousPointer: new Vector2(),
      centers: candles.map(
        (c) => new Vector3(c.x, c.y + c.height * 1.06 + c.radius * 0.6, c.z)
      )
    }),
    [candles]
  )

  const resources = useMemo(() => {
    const body = createCandleGeometry()
    const lit = new InstancedBufferAttribute(
      new Float32Array(candles.length).fill(1),
      1
    ).setUsage(DynamicDrawUsage)
    const bend = new InstancedBufferAttribute(
      new Float32Array(candles.length),
      1
    ).setUsage(DynamicDrawUsage)
    body.setAttribute("aLit", lit)
    body.setAttribute(
      "aSeed",
      new InstancedBufferAttribute(
        Float32Array.from(candles, (c) => c.seed),
        1
      )
    )
    body.setAttribute(
      "aWaxTint",
      new InstancedBufferAttribute(
        Float32Array.from(candles.flatMap((c) => c.tint)),
        3
      )
    )
    const flame = new PlaneGeometry(1, 1)
    flame.setAttribute("aLit", lit)
    flame.setAttribute("aBend", bend)
    flame.setAttribute(
      "aSeed",
      new InstancedBufferAttribute(
        Float32Array.from(candles, (c) => c.seed),
        1
      )
    )
    const pool = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    pool.setAttribute("aLit", lit)
    const smokeGeometry = new PlaneGeometry(1, 1)
    const smokeAge = new InstancedBufferAttribute(
      new Float32Array(candles.length).fill(1),
      1
    ).setUsage(DynamicDrawUsage)
    smokeGeometry.setAttribute("aSmokeAge", smokeAge)
    smokeGeometry.setAttribute("aSeed", flame.getAttribute("aSeed"))
    const fade = { value: 0 }
    const bodyMaterial = new ShaderMaterial({
      vertexShader: bodyVert,
      fragmentShader: bodyFrag,
      vertexColors: true,
      uniforms: {
        fadeFactor: fade,
        uLightFlicker: lightFlickerUniform,
        uLightning: lightningUniform
      }
    })
    const flameMaterial = new ShaderMaterial({
      vertexShader: flameVert,
      fragmentShader: flameFrag,
      uniforms: {
        fadeFactor: fade,
        uTime: { value: 0 },
        uMotion: { value: reducedMotion ? 0 : 1 }
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false
    })
    const poolMaterial = new ShaderMaterial({
      vertexShader: poolVert,
      fragmentShader: poolFrag,
      uniforms: { fadeFactor: fade },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false
    })
    const smokeMaterial = new ShaderMaterial({
      vertexShader: smokeVert,
      fragmentShader: smokeFrag,
      uniforms: { fadeFactor: fade, uMotion: { value: reducedMotion ? 0 : 1 } },
      transparent: true,
      depthWrite: false
    })
    return {
      body,
      flame,
      pool,
      bodyMaterial,
      flameMaterial,
      poolMaterial,
      fade,
      lit,
      bend,
      smokeGeometry,
      smokeMaterial,
      smokeAge
    }
  }, [candles, reducedMotion])

  useLayoutEffect(() => {
    if (!bodies.current || !flames.current || !pools.current || !smoke.current)
      return
    const matrix = new Matrix4()
    candles.forEach((candle, i) => {
      matrix
        .makeRotationY(candle.rotation)
        .scale(new Vector3(candle.radius, candle.height, candle.radius))
        .setPosition(candle.x, candle.y, candle.z)
      bodies.current!.setMatrixAt(i, matrix)
      matrix
        .makeScale(candle.radius * 2.8, candle.radius * 2.6, 1)
        .setPosition(candle.x, candle.y + candle.height * 1.06, candle.z)
      flames.current!.setMatrixAt(i, matrix)
      matrix
        .makeScale(candle.radius * 3.5, candle.radius * 6, 1)
        .setPosition(candle.x, candle.y + candle.height * 1.06, candle.z)
      smoke.current!.setMatrixAt(i, matrix)
      matrix
        .makeScale(candle.radius * 4, 1, candle.radius * 4)
        .setPosition(candle.x, candle.y, candle.z)
      pools.current!.setMatrixAt(i, matrix)
    })
    for (const mesh of [
      bodies.current,
      flames.current,
      pools.current,
      smoke.current
    ])
      mesh.instanceMatrix.needsUpdate = true
  }, [candles])

  useEffect(
    () => () => {
      resources.body.dispose()
      resources.flame.dispose()
      resources.pool.dispose()
      resources.bodyMaterial.dispose()
      resources.flameMaterial.dispose()
      resources.poolMaterial.dispose()
      resources.smokeGeometry.dispose()
      resources.smokeMaterial.dispose()
    },
    [resources]
  )

  useFrameCallback((state, delta, time) => {
    resources.fade.value = fadeFactor.current.get()
    resources.flameMaterial.uniforms.uTime.value = time
    let selected = -1
    let nearest = Infinity
    if (
      pointer.active &&
      resources.fade.value < 0.01 &&
      !useNavigationStore.getState().isCameraTransitioning
    ) {
      scratch.raycaster.setFromCamera(pointer.position, state.camera)
      candles.forEach((candle, i) => {
        scratch.sphere.set(scratch.centers[i], candle.radius * 1.5)
        if (!scratch.raycaster.ray.intersectSphere(scratch.sphere, scratch.hit))
          return
        const distance = scratch.hit.distanceToSquared(
          scratch.raycaster.ray.origin
        )
        if (distance < nearest) {
          nearest = distance
          selected = i
        }
      })
    }
    const direction = Math.sign(pointer.position.x - scratch.previousPointer.x)
    scratch.previousPointer.copy(pointer.position)
    interaction.forEach((candle, i) => {
      updateCandle(
        candle,
        i === selected,
        direction,
        time,
        delta,
        reducedMotion
      )
      resources.lit.setX(i, candle.light)
      resources.bend.setX(i, candle.bend)
      resources.smokeAge.setX(
        i,
        Math.min(1, Math.max(0, (time - candle.smokeStartedAt) / 2.4))
      )
    })
    resources.lit.needsUpdate = true
    resources.bend.needsUpdate = true
    resources.smokeAge.needsUpdate = true
  })

  return (
    <group dispose={null}>
      <instancedMesh
        name="halloween-candle-smoke"
        ref={smoke}
        args={[
          resources.smokeGeometry,
          resources.smokeMaterial,
          candles.length
        ]}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        name="halloween-candle-bodies"
        ref={bodies}
        args={[resources.body, resources.bodyMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        name="halloween-candle-flames"
        ref={flames}
        args={[resources.flame, resources.flameMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        name="halloween-candle-pools"
        ref={pools}
        args={[resources.pool, resources.poolMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
        renderOrder={-3}
      />
    </group>
  )
}
