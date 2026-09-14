import { BackSide, Texture, Vector2, Vector3 } from "three"
import { Fn, modelViewProjection, uv, vec4 } from "three/tsl"

import { createNodeMaterial } from "@/lib/graphics/material"
import { createShader as displayFragmentShader } from "@/shaders/generated/sky"
import { createShader as lutFragmentShader } from "@/shaders/generated/sky-lut"

export const createSkyLutMaterial = () =>
  createNodeMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uSunDir: { value: new Vector3(0, 1, 0) },
      uSunIntensity: { value: 20 },
      uCloudCover: { value: 0.2 },
      uRainFactor: { value: 0 },
      uNightFactor: { value: 0 },
      uNightAmbient: { value: new Vector3(0.004, 0.006, 0.012) },
      uTwilight: { value: 0 },
      uTwilightHorizon: { value: new Vector3(1, 0.3, 0.12) },
      uTwilightZenith: { value: new Vector3(0.62, 0.45, 0.95) }
    },
    // Node render targets use a top-left origin on both backends.
    fragmentNodeFactory: (uniforms) =>
      lutFragmentShader(uniforms, { vUv: uv().flipY() })
  })

export const createSkyMaterial = (lut: Texture) =>
  createNodeMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: true,
    vertexNode: Fn(() => {
      const clip = (modelViewProjection as any).toVar()
      return vec4(clip.xy, clip.w, clip.w)
    })(),
    uniforms: {
      uSkyLut: { value: lut },
      uTime: { value: 0 },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uSunColor: { value: new Vector3(1, 1, 1) },
      uSunDiscIntensity: { value: 60 },
      uSunGlowIntensity: { value: 2 },
      uCloudCover: { value: 0.2 },
      uCloudOffset: { value: new Vector2(0, 0) },
      uCloudColorZenith: { value: new Vector3(1, 1, 1) },
      uCloudColorHorizon: { value: new Vector3(1, 1, 1) },
      uNightFactor: { value: 0 },
      uStarBoost: { value: 0 },
      uMoonDir: { value: new Vector3(0, 1, 0) },
      uMoonTangent: { value: new Vector3(1, 0, 0) },
      uMoonBitangent: { value: new Vector3(0, 0, 1) },
      uMoonLight: { value: 0 },
      uMoonMap: { value: null },
      uLightning: { value: 0 }
    },
    fragmentNodeFactory: displayFragmentShader
  })
