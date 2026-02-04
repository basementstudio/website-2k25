import { Sparkles as SparklesImpl } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"
import { PointsNodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec3,
  uniform,
  attribute,
  positionLocal,
  sin,
  cos,
  max,
  dot,
  fract,
  mod,
  smoothstep,
  step,
  clamp
} from "three/tsl"

import { BASE_CONFIG, SPAWN_POINTS } from "@/constants/sparkles"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useFadeAnimation } from "../inspectables/use-fade-animation"

interface SparklesProps {
  count?: number
  speed?: number | Float32Array
  opacity?: number | Float32Array
  color?: THREE.ColorRepresentation | Float32Array
  size?: number | Float32Array
  scale?: number | [number, number, number] | THREE.Vector3
  noise?: number | [number, number, number] | THREE.Vector3 | Float32Array
}

export const Sparkle = (props: SparklesProps) => {
  const { material, uniforms } = useMemo(() => {
    const uTime = uniform(0)
    const uPixelRatio = uniform(2)
    const uFadeFactor = uniform(0)

    const aSize = attribute("size", "float")
    const aSpeed = attribute("speed", "float")
    const aOpacity = attribute("opacity", "float")
    const aNoise = attribute("noise", "vec3")
    const aColor = attribute("color", "vec3")

    const mat = new PointsNodeMaterial()
    mat.transparent = true
    mat.depthWrite = false
    mat.sizeAttenuation = false

    // Position with jitter
    mat.positionNode = Fn(() => {
      const pos = positionLocal.toVar()
      pos.x.addAssign(
        sin(uTime.mul(aSpeed).add(pos.x.mul(aNoise.x).mul(100.0))).mul(0.2)
      )
      pos.y.addAssign(
        cos(uTime.mul(aSpeed).add(pos.y.mul(aNoise.y).mul(100.0))).mul(0.2)
      )
      pos.z.addAssign(
        cos(uTime.mul(aSpeed).add(pos.z.mul(aNoise.z).mul(100.0))).mul(0.2)
      )
      return pos
    })()

    // Point size: size * pixelRatio, min 1px
    ;(mat as any).sizeNode = max(aSize.mul(uPixelRatio), 1.0)

    // Color
    mat.colorNode = aColor

    // Opacity with pulse animation
    mat.opacityNode = Fn(() => {
      const seed = fract(
        sin(dot(positionLocal, vec3(12.9898, 78.233, 45.164))).mul(43758.5453)
      ).mul(10.0)
      const cycle = mod(uTime.mul(aSpeed).add(seed.mul(10.0)), 10.0)
      const fadeIn = smoothstep(0.0, 0.3, cycle)
      const fadeOut = smoothstep(1.0, 0.7, cycle)
      const pulse = step(cycle, 1.0).mul(fadeIn).mul(fadeOut)
      return clamp(aOpacity.mul(pulse), 0.0, 1.0)
        .mul(0.5)
        .mul(float(1.0).sub(uFadeFactor))
    })()

    // drei's Sparkles updates material.time via getter/setter
    Object.defineProperty(mat, "time", {
      get: () => uTime.value,
      set: (v: number) => {
        uTime.value = v
      }
    })

    return {
      material: mat,
      uniforms: {
        time: uTime,
        pixelRatio: uPixelRatio,
        fadeFactor: uFadeFactor
      }
    }
  }, [])

  const { fadeFactor } = useFadeAnimation()

  useFrameCallback(() => {
    uniforms.fadeFactor.value = fadeFactor.current.get()
  })

  return (
    <SparklesImpl {...props}>
      <primitive object={material} attach="material" />
    </SparklesImpl>
  )
}

export const Sparkles = () => {
  const { isMobile } = useDeviceDetect()

  if (isMobile) return null

  return (
    <>
      {SPAWN_POINTS.map((point, index) => (
        <mesh key={index} position={point.position} raycast={() => null}>
          <Sparkle {...BASE_CONFIG} count={point.count} scale={point.scale} />
        </mesh>
      ))}
    </>
  )
}
