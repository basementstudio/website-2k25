import { useEffect, useMemo, useState } from "react"
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector3
} from "three"

import { useAssets } from "@/components/assets-provider"
import pumpkinFragment from "@/components/halloween/pumpkins/frag.glsl"
import { createPumpkinGeometry } from "@/components/halloween/pumpkins/geometry"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  createGlobalShaderMaterial,
  lightFlickerUniform,
  lightningUniform,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import { IsHalloweenSeason } from "@/utils/special-events"

import pumpkinVertex from "./pumpkin-ball.vert.glsl"

// The local ball and multiplayer copies share the same seasonal appearance.
export const useBallAppearance = (opacity = 1) => {
  const { basketball } = useAssets()
  const model = useKTX2GLTF(basketball)
  const [halloween] = useState(IsHalloweenSeason)
  const appearance = useMemo(() => {
    const source = model.scene.children[0] as Mesh
    source.geometry.computeBoundingSphere()
    const radius = source.geometry.boundingSphere!.radius
    if (halloween) {
      const geometry = createPumpkinGeometry()
      const pumpkinScale = radius / 0.62
      geometry
        .translate(0, -0.47, 0)
        .scale(pumpkinScale, pumpkinScale, pumpkinScale)
      const material = new ShaderMaterial({
        vertexShader: pumpkinVertex,
        fragmentShader: pumpkinFragment,
        uniforms: {
          uPumpkinScale: { value: pumpkinScale },
          uTint: { value: new Color("#cd6b25") },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
          fadeFactor: { value: 0 },
          uLightFlicker: lightFlickerUniform,
          uLightning: lightningUniform
        },
        transparent: opacity < 1,
        depthWrite: opacity === 1
      })
      return {
        geometry,
        material,
        radius,
        rotation: [0, 0, 0] as [number, number, number]
      }
    }
    const base = (source.material as MeshStandardMaterial).clone()
    base.transparent = opacity < 1
    base.opacity = opacity
    const material = createGlobalShaderMaterial(base, {
      LIGHT: true,
      BASKETBALL: true
    })
    material.uniforms.lightDirection.value = new Vector3(0, 1, -1)
    material.uniforms.backLightDirection.value = new Vector3(0, 0, 1)
    material.depthWrite = opacity === 1
    return {
      geometry: source.geometry,
      material,
      radius,
      rotation: [-Math.PI / 2, 0, -Math.PI / 2] as [number, number, number]
    }
  }, [model, halloween, opacity])

  useFrameCallback((_, __, time) => {
    if (halloween) appearance.material.uniforms.uTime.value = time
  })

  useEffect(
    () => () => {
      if (halloween) appearance.geometry.dispose()
      else
        useCustomShaderMaterial
          .getState()
          .removeMaterial(appearance.material.id)
      appearance.material.dispose()
    },
    [appearance, halloween]
  )

  return appearance
}
