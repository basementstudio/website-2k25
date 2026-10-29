import { useEffect, useMemo, useState } from "react"
import { Mesh, MeshStandardMaterial, Vector3 } from "three"

import { useAssets } from "@/components/assets-provider"
import { createPumpkinMaterial } from "@/components/halloween/pumpkins/material"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import { IsHalloweenSeason } from "@/utils/special-events"

// The local ball and multiplayer copies share the same seasonal appearance.
export const useBallAppearance = (opacity = 1) => {
  const { basketball, specialEvents } = useAssets()
  const model = useKTX2GLTF(basketball)
  const [halloween] = useState(IsHalloweenSeason)
  const seasonalModel = useKTX2GLTF(
    halloween ? specialEvents.halloween.pumpkin : basketball,
    "/draco/"
  )
  const appearance = useMemo(() => {
    const source = model.scene.children[0] as Mesh
    source.geometry.computeBoundingSphere()
    const radius = source.geometry.boundingSphere!.radius
    if (halloween) {
      let authored: Mesh | undefined
      seasonalModel.scene.updateMatrixWorld(true)
      seasonalModel.scene.traverse((object) => {
        if (object instanceof Mesh) authored = object
      })
      if (!authored) throw new Error("The seasonal pumpkin GLB has no mesh")
      const geometry = authored.geometry
        .clone()
        .applyMatrix4(authored.matrixWorld)
      if (!geometry.hasAttribute("normal")) geometry.computeVertexNormals()
      geometry.computeBoundingBox()
      const bounds = geometry.boundingBox!
      const size = bounds.getSize(new Vector3())
      const center = bounds.getCenter(new Vector3())
      const pumpkinScale = radius / (Math.max(size.x, size.z) * 0.5)
      // Fit the body to the collider; the curly stem extends above it.
      geometry
        .translate(-center.x, -(bounds.min.y + size.y * 0.34), -center.z)
        .scale(pumpkinScale, pumpkinScale, pumpkinScale)
      const material = createPumpkinMaterial(
        authored.material as MeshStandardMaterial,
        geometry.hasAttribute("color"),
        opacity
      )
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
  }, [model, seasonalModel, halloween, opacity])

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
