import { ShaderMaterial, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

/**
 * Depth-of-field focus curve: view distances where the far blur starts and
 * saturates, and the blur radius in CSS pixels. The window sits well inside
 * uDofStart, so only the world outside defocuses. Leva-tunable behind ?debug.
 */
export const dofConfig = { start: 20, end: 55, radius: 2.6 }

export const createPostProcessingMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uMainTexture: { value: null },
      uDepthTexture: { value: null },
      aspect: { value: 1 },
      resolution: { value: new Vector2(1, 1) },
      uTime: { value: 0.0 },
      uOpacity: { value: 1.0 },

      // Depth of field (far blur)
      uDofStart: { value: dofConfig.start },
      uDofEnd: { value: dofConfig.end },
      uDofRadius: { value: dofConfig.radius },
      uCameraNear: { value: 0.1 },
      uCameraFar: { value: 2000 },

      uActiveBloom: { value: 1 },

      // Basics
      uContrast: { value: 1 },
      uBrightness: { value: 1 },
      uExposure: { value: 1 },
      uGamma: { value: 1 },

      // Vignette
      uVignetteRadius: { value: 0.9 },
      uVignetteSpread: { value: 0.5 },

      // Bloom
      uBloomTexture: { value: null },
      uBloomResolution: { value: new Vector2(1, 1) },
      uBloomStrength: { value: 1 },
      uBloomRadius: { value: 1 },
      uBloomThreshold: { value: 1 }
    },
    vertexShader,
    fragmentShader
  })
