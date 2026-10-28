import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { CANDLE_CLUSTERS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import bodyFrag from "./body-frag.glsl"
import bodyVert from "./body-vert.glsl"
import flameFrag from "./flame-frag.glsl"
import flameVert from "./flame-vert.glsl"
import { createCandleGeometry } from "./geometry"
import poolFrag from "./pool-frag.glsl"
import poolVert from "./pool-vert.glsl"

// Three pillars in a loose triangle; shelf groups rotate the long axis into Z.
const PILLARS = [
  { x: -0.14, z: 0, height: 0.3, radius: 0.058 },
  { x: 0.02, z: -0.035, height: 0.21, radius: 0.05 },
  { x: 0.15, z: 0.055, height: 0.145, radius: 0.06 }
]

// Three draws for all candles: wax/holders/wicks, flames, surface glows.
// No dynamic lights or shadows: the office uses baked lighting.
export const HalloweenCandles = () => {
  const bodies = useRef<InstancedMesh>(null)
  const flames = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)
  const { fadeFactor } = useFadeAnimation()
  const candles = useMemo(
    () =>
      CANDLE_CLUSTERS.flatMap((cluster) =>
        PILLARS.map((pillar, i) => {
          const c = Math.cos(cluster.rotation)
          const s = Math.sin(cluster.rotation)
          const depth = cluster.name.includes("shelf") ? 0.4 : 1
          return {
            x:
              cluster.position[0] +
              (pillar.x * c - pillar.z * depth * s) * cluster.scale,
            y: cluster.position[1] + 0.003,
            z:
              cluster.position[2] +
              (pillar.x * s + pillar.z * depth * c) * cluster.scale,
            height: pillar.height * cluster.scale,
            radius: pillar.radius * cluster.scale,
            seed: (cluster.position[2] * 0.31 + i * 0.37) % 1
          }
        })
      ),
    []
  )

  const resources = useMemo(() => {
    const body = createCandleGeometry()
    const flame = new PlaneGeometry(1, 1)
    flame.setAttribute(
      "aSeed",
      new InstancedBufferAttribute(
        Float32Array.from(candles, (c) => c.seed),
        1
      )
    )
    const pool = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
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
      uniforms: { fadeFactor: fade, uTime: { value: 0 } },
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
    return {
      body,
      flame,
      pool,
      bodyMaterial,
      flameMaterial,
      poolMaterial,
      fade
    }
  }, [candles])

  useLayoutEffect(() => {
    if (!bodies.current || !flames.current || !pools.current) return
    const matrix = new Matrix4()
    candles.forEach((candle, i) => {
      matrix
        .makeScale(candle.radius, candle.height, candle.radius)
        .setPosition(candle.x, candle.y, candle.z)
      bodies.current!.setMatrixAt(i, matrix)
      matrix
        .makeScale(candle.radius * 2.8, candle.radius * 2.6, 1)
        .setPosition(candle.x, candle.y + candle.height * 1.06, candle.z)
      flames.current!.setMatrixAt(i, matrix)
      matrix
        .makeScale(candle.radius * 4, 1, candle.radius * 4)
        .setPosition(candle.x, candle.y, candle.z)
      pools.current!.setMatrixAt(i, matrix)
    })
    for (const mesh of [bodies.current, flames.current, pools.current])
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
    },
    [resources]
  )

  useFrameCallback((_, __, time) => {
    resources.fade.value = fadeFactor.current.get()
    resources.flameMaterial.uniforms.uTime.value = time
  })

  return (
    <group dispose={null}>
      <instancedMesh
        ref={bodies}
        args={[resources.body, resources.bodyMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={flames}
        args={[resources.flame, resources.flameMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={pools}
        args={[resources.pool, resources.poolMaterial, candles.length]}
        frustumCulled={false}
        raycast={() => null}
        renderOrder={-3}
      />
    </group>
  )
}
