import { ShaderMaterial } from "three"

import vertexShader from "../material-postprocessing/vertex.glsl"
import fragmentShader from "./fragment.glsl"

export const createBloomMaterial = (
  sharedUniforms: Record<string, { value: unknown }>
) =>
  new ShaderMaterial({
    uniforms: {
      uMainTexture: sharedUniforms.uMainTexture,
      resolution: sharedUniforms.resolution,
      uActiveBloom: sharedUniforms.uActiveBloom,
      uBloomStrength: sharedUniforms.uBloomStrength,
      uBloomRadius: sharedUniforms.uBloomRadius,
      uBloomThreshold: sharedUniforms.uBloomThreshold
    },
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false
  })
