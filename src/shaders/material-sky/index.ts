import { BackSide, ShaderMaterial, Texture, Vector2, Vector3 } from "three"

import displayFragmentShader from "./fragment.glsl"
import lutFragmentShader from "./lut-fragment.glsl"
import lutVertexShader from "./lut-vertex.glsl"
import displayVertexShader from "./vertex.glsl"

export const createSkyLutMaterial = () =>
  new ShaderMaterial({
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
    vertexShader: lutVertexShader,
    fragmentShader: lutFragmentShader
  })

export const createSkyMaterial = (lut: Texture) =>
  new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: true,
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
      uLightning: { value: 0 }
    },
    vertexShader: displayVertexShader,
    fragmentShader: displayFragmentShader
  })
