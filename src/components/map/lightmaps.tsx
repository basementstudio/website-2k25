"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { animate } from "motion"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
  Mesh,
  NearestFilter,
  NoColorSpace,
  ShaderMaterial,
  Texture
} from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useCustomShaderMaterial } from "@/shaders/custom-shader-material"

import { useAssets } from "../assets-provider"

function useLightmaps(): Record<string, Texture> {
  const { lightmaps } = useAssets()

  const loadedMaps = useLoader(
    EXRLoader,
    lightmaps.map((lightmap) => lightmap.url)
  )

  const lightMaps = useMemo(() => {
    return loadedMaps.reduce(
      (acc, map, index) => {
        map.flipY = true
        map.magFilter = NearestFilter
        map.colorSpace = NoColorSpace
        acc[lightmaps[index].mesh] = map
        return acc
      },
      {} as Record<string, Texture>
    )
  }, [lightmaps, loadedMaps])

  return lightMaps
}

function Lightmaps() {
  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const lightMaps = useLightmaps()

  const scene = useThree((state) => state.scene)

  useEffect(() => {
    animate(0, 1, {
      duration: 1.5,
      ease: "easeIn",
      onUpdate: (latest) => {
        Object.values(shaderMaterialsRef).forEach((material) => {
          material.uniforms.uLoaded.value = latest
        })
      }
    })

    function addLightmap(mesh: Mesh, lightmap: Texture) {
      if (!mesh.userData.hasGlobalMaterial) return

      const material = mesh.material as ShaderMaterial
      material.uniforms.lightMap.value = lightmap
    }

    Object.entries(lightMaps).forEach(([mesh, lightmap]) => {
      const meshOrGroup = scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        addLightmap(meshOrGroup, lightmap)
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) {
            addLightmap(child, lightmap)
          }
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function LightmapLoaderInner() {
  return (
    <Suspense>
      <Lightmaps />
    </Suspense>
  )
}

export const LightmapLoader = memo(LightmapLoaderInner)
