import { ShaderMaterial, Texture } from "three"
import { FrontSide, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createNotFoundMaterial = (tDiffuse: { value: Texture }) =>
  new ShaderMaterial({
    side: FrontSide,
    uniforms: {
      tDiffuse: tDiffuse,
      uTime: { value: 0 },
      resolution: { value: new Vector2(1024, 1024) }
    },
    vertexShader,
    fragmentShader
  })
