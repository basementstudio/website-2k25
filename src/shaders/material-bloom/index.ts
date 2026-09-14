import { screenCoordinate, vec4 } from "three/tsl"

import { createNodeMaterial } from "@/lib/graphics/material"
import { createShader as fragmentNodeFactory } from "@/shaders/generated/bloom"

export const createBloomMaterial = (
  sharedUniforms: Record<string, { value: unknown }>
) =>
  createNodeMaterial({
    uniforms: {
      uMainTexture: sharedUniforms.uMainTexture,
      resolution: sharedUniforms.resolution,
      uActiveBloom: sharedUniforms.uActiveBloom,
      uBloomStrength: sharedUniforms.uBloomStrength,
      uBloomRadius: sharedUniforms.uBloomRadius,
      uBloomThreshold: sharedUniforms.uBloomThreshold
    },
    fragmentNodeFactory: (uniforms) =>
      fragmentNodeFactory(uniforms, {
        gl_FragCoord: vec4(screenCoordinate, 0, 1)
      }),
    depthTest: false,
    depthWrite: false
  })
