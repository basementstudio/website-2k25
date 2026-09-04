import { BackSide, ShaderMaterial, Texture, Vector2, Vector3 } from "three"

import displayFragmentShader from "./fragment.glsl"
import lutFragmentShader from "./lut-fragment.glsl"
import lutVertexShader from "./lut-vertex.glsl"
import displayVertexShader from "./vertex.glsl"

// Standalone materials on purpose: the global uber-material pins a single
// customProgramCacheKey and its frame-loop sweep writes uniforms these
// shaders don't have. The Sky component drives all uniforms itself.

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
      uNightAmbient: { value: new Vector3(0.004, 0.006, 0.012) }
    },
    vertexShader: lutVertexShader,
    fragmentShader: lutFragmentShader
  })

export const createSkyMaterial = (lut: Texture) =>
  new ShaderMaterial({
    // Viewed from inside the sphere. Depth-tested at the far plane (vertex
    // shader pins z = w) and drawn after the other opaques, so occluded sky
    // fragments are rejected by early-z instead of shaded and overdrawn.
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
      uGroundColor: { value: new Vector3(0.05, 0.05, 0.06) }
    },
    vertexShader: displayVertexShader,
    fragmentShader: displayFragmentShader
  })
