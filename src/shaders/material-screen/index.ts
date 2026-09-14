import { createNodeMaterial } from "@/lib/graphics/material"
import { createShader as fragmentNodeFactory } from "@/shaders/generated/screen"

export const createScreenMaterial = () =>
  createNodeMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      map: { value: null },
      uRevealProgress: { value: 1.0 },
      uFlip: { value: 0 },
      uGameMode: { value: 0 },
      uIsGameRunning: { value: 0.0 }
    },
    fragmentNodeFactory
  })
