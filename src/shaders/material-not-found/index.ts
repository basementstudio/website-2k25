import { FrontSide, Texture, Vector2 } from "three"
import { uv } from "three/tsl"

import { createNodeMaterial } from "@/lib/graphics/material"
import { createShader as fragmentNodeFactory } from "@/shaders/generated/not-found"

export const createNotFoundMaterial = (tDiffuse: { value: Texture }) =>
  createNodeMaterial({
    side: FrontSide,
    uniforms: {
      tDiffuse: tDiffuse,
      uTime: { value: 0 },
      resolution: { value: new Vector2(1024, 1024) }
    },
    fragmentNodeFactory: (uniforms) =>
      fragmentNodeFactory(uniforms, { vUv: uv().flipY() })
  })
