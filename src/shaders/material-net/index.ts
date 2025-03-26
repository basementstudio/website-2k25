import { DataTexture, DoubleSide, ShaderMaterial, Texture } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

interface NetMaterialProps {
  offsets: DataTexture
  texture: Texture
  totalFrames: number
  offsetScale: number
  vertexCount: number
}

export const createNetMaterial = ({
  offsets,
  texture,
  totalFrames,
  offsetScale,
  vertexCount
}: NetMaterialProps) =>
  new ShaderMaterial({
    transparent: true,
    side: DoubleSide,
    uniforms: {
      tDisplacement: { value: offsets },
      map: { value: texture },
      currentFrame: { value: 0 },
      totalFrames: { value: totalFrames },
      offsetScale: { value: offsetScale },
      vertexCount: { value: vertexCount }
    },
    vertexShader,
    fragmentShader
  })
