import { ShaderMaterial, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createPostProcessingMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uMainTexture: { value: null },
      // TODO implement depth based reveal
      uDepthTexture: { value: null },
      aspect: { value: 1 },
      resolution: { value: new Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uTime: { value: 0.0 },
      uOpacity: { value: 1.0 },

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
      uBloomStrength: { value: 1 },
      uBloomRadius: { value: 1 },
      uBloomThreshold: { value: 1 }
    },
    vertexShader,
    fragmentShader
  })
