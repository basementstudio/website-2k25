"use client"

import { useEffect, useMemo, useRef } from "react"
import { CanvasTexture, Texture } from "three"
import * as THREE from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec3,
  uniform,
  uv,
  texture as tslTexture,
  sin,
  dot,
  fract,
  clamp,
  pow,
  mix,
  step,
  time
} from "three/tsl"

const createCRTMaterial = () => {
  const uTexture = tslTexture(new Texture())
  const uTime = time
  const uCurvature = uniform(0.3)
  const uScanlineIntensity = uniform(0.75)
  const uScanlineCount = uniform(200)
  const uVignetteIntensity = uniform(0.3)
  const uBrightness = uniform(0.05)
  const uContrast = uniform(1.2)

  const material = new NodeMaterial()

  // Barrel distortion: warp UV based on distance from center
  const barrelDistortionFn = /* @__PURE__ */ Fn(([coord, amt]: [any, any]) => {
    const cc = coord.sub(0.5)
    const dist = dot(cc, cc)
    return coord.add(cc.mul(dist).mul(amt))
  })

  // Scanline: sin-based scanline pattern
  const scanlineFn = /* @__PURE__ */ Fn(
    ([uvY, resolution, opacity]: [any, any, any]) => {
      const intensity = sin(uvY.mul(resolution).mul(Math.PI * 2.0))
        .mul(0.5)
        .add(0.5)
        .mul(0.9)
        .add(0.1)
      return clamp(intensity, 0.0, 1.0)
        .mul(opacity)
        .add(float(1.0).sub(opacity))
    }
  )

  // Vignette: darken edges
  const vignetteFn = /* @__PURE__ */ Fn(
    ([uvCoord, vigIntensity]: [any, any]) => {
      const vigUv = vec2(
        uvCoord.x.mul(float(1.0).sub(uvCoord.y)),
        uvCoord.y.mul(float(1.0).sub(uvCoord.x))
      )
      const vig = vigUv.x.mul(vigUv.y).mul(15.0)
      return pow(vig, vigIntensity)
    }
  )

  // Hash-based noise
  const randomFn = /* @__PURE__ */ Fn(([co]: [any]) => {
    return fract(sin(dot(co, vec2(12.9898, 78.233))).mul(43758.5453))
  })

  material.colorNode = Fn(() => {
    const vUv = uv()

    // Apply barrel distortion
    const distortedUv = barrelDistortionFn(vUv, uCurvature)

    // Branchless bounds check: 1 when inside [0,1], 0 when outside
    const inBounds = float(step(float(0.0), distortedUv.x))
      .mul(float(step(distortedUv.x, float(1.0))))
      .mul(float(step(float(0.0), distortedUv.y)))
      .mul(float(step(distortedUv.y, float(1.0))))

    // Chromatic aberration
    const aberrationAmount = float(0.01)
    const distFromCenter = vUv.sub(0.5)

    const r = uTexture
      .sample(distortedUv.sub(distFromCenter.mul(aberrationAmount)))
      .r
    const g = uTexture.sample(distortedUv).g
    const b = uTexture
      .sample(distortedUv.add(distFromCenter.mul(aberrationAmount)))
      .b

    const color = vec3(r, g, b).toVar()

    // Scanlines
    color.mulAssign(
      scanlineFn(distortedUv.y, uScanlineCount, uScanlineIntensity)
    )

    // Flicker
    color.mulAssign(float(1.0).add(sin(uTime.mul(6.0)).mul(0.01)))

    // Brightness and contrast
    color.assign(color.sub(0.5).mul(uContrast).add(0.5).add(uBrightness))

    // Vignette
    color.mulAssign(vignetteFn(distortedUv, uVignetteIntensity))

    // Subtle noise
    color.addAssign(randomFn(distortedUv.add(uTime)).mul(0.03))

    // Phosphor glow (green phosphor boost: g *= 1.05 * 1.1)
    const phosphor = vec3(
      color.x.mul(1.05),
      color.y.mul(1.155),
      color.z.mul(1.05)
    )
    color.assign(mix(color, phosphor, 0.3))

    // Clamp
    color.assign(clamp(color, 0.0, 1.0))

    // Gamma correction
    color.assign(pow(color, vec3(1.5, 1.5, 1.5)))

    // Final: multiply by 4 and mask out-of-bounds regions
    color.mulAssign(4.0)
    color.mulAssign(inBounds)

    return color
  })()

  material.opacityNode = float(1.0)

  return {
    material,
    uniforms: {
      uTexture,
      uTime,
      uCurvature,
      uScanlineIntensity,
      uScanlineCount,
      uVignette: uVignetteIntensity,
      uBrightness,
      uContrast
    }
  }
}

interface CRTMeshProps {
  texture: CanvasTexture
}

export function CRTMesh({ texture }: CRTMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { material, uniforms } = useMemo(() => createCRTMaterial(), [])

  useEffect(() => {
    uniforms.uTexture.value = texture
  }, [texture, uniforms])

  return (
    <mesh position={[8.151, 1.232, -13.9]} ref={meshRef}>
      <planeGeometry args={[0.6, 0.47]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
