"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { animate } from "motion"
import { memo, Suspense, useEffect, useMemo, useRef } from "react"
import {
  Group,
  Mesh,
  NearestFilter,
  NoColorSpace,
  ShaderMaterial,
  Texture,
  TextureLoader
} from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

import { useAssets } from "../assets-provider"

interface MapAssets {
  lightmap?: Texture
  aomap?: Texture
}

const useMapAssets = (): Record<string, MapAssets> => {
  const { mapAssets } = useAssets()

  const withLightmap = useMemo(
    () => mapAssets.filter((mesh) => mesh.lightmap),
    [mapAssets]
  )
  const withAmbientOcclusion = useMemo(
    () => mapAssets.filter((mesh) => mesh.ambientOcclusion),
    [mapAssets]
  )

  const loadedLightmaps = useLoader(
    EXRLoader,
    withLightmap.map((mesh) => mesh.lightmap)
  )

  const loadedAmbientOcclusion = useLoader(
    TextureLoader,
    withAmbientOcclusion.map((mesh) => mesh.ambientOcclusion)
  )

  const meshMaps = useMemo(() => {
    const maps: Record<string, { lightmap?: Texture; aomap?: Texture }> = {}

    loadedLightmaps.forEach((map, index) => {
      const meshName = withLightmap[index].mesh
      map.flipY = true
      map.magFilter = NearestFilter
      map.colorSpace = NoColorSpace

      if (!maps[meshName]) {
        maps[meshName] = {}
      }
      maps[meshName].lightmap = map
    })

    loadedAmbientOcclusion.forEach((map, index) => {
      const meshName = withAmbientOcclusion[index].mesh
      map.flipY = false
      map.magFilter = NearestFilter
      map.colorSpace = NoColorSpace

      if (!maps[meshName]) {
        maps[meshName] = {}
      }
      maps[meshName].aomap = map
    })

    return maps
  }, [
    loadedLightmaps,
    loadedAmbientOcclusion,
    withLightmap,
    withAmbientOcclusion
  ])

  return meshMaps
}

const MapAssets = () => {
  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const meshMaps = useMapAssets()

  const scene = useThree((state) => state.scene)

  const elementsWithLightmaps = useRef<Mesh[]>([])
  const elementsWithAmbientOcclusion = useRef<Mesh[]>([])

  useControls("lightmaps", {
    intensity: {
      value: 1.0,
      min: 0.001,
      max: 8,
      step: 0.001,
      onChange: (value) => {
        elementsWithLightmaps.current.forEach((mesh) => {
          const material = mesh.material as ShaderMaterial
          material.uniforms.lightMapIntensity.value = value
        })
      }
    }
  })

  useControls("aomap", {
    intensity: {
      value: 1.0,
      min: 0.001,
      max: 8,
      step: 0.001,
      onChange: (value) => {
        elementsWithAmbientOcclusion.current.forEach((mesh) => {
          const material = mesh.material as ShaderMaterial
          material.uniforms.aoMapIntensity.value = value
        })
      }
    },
    showCheckerboard: {
      value: false,
      onChange: (value) => {
        elementsWithAmbientOcclusion.current.forEach((mesh) => {
          const material = mesh.material as ShaderMaterial
          material.uniforms.aoWithCheckerboard.value = value
        })
      }
    }
  })

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

    const addLightmap = (mesh: Mesh, lightmap: Texture) => {
      if (!mesh.userData.hasGlobalMaterial) return

      const material = mesh.material as ShaderMaterial
      material.uniforms.lightMap.value = lightmap
      material.uniforms.lightMapIntensity.value = 1.0
    }

    const addAmbientOcclusion = (mesh: Mesh, ambientOcclusion: Texture) => {
      if (!mesh.userData.hasGlobalMaterial) return

      const material = mesh.material as ShaderMaterial
      material.uniforms.aoMap.value = ambientOcclusion
      material.uniforms.aoMapIntensity.value = 1.0
    }

    Object.entries(meshMaps).forEach(([mesh, maps]) => {
      const meshOrGroup = scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        if (maps.lightmap) {
          addLightmap(meshOrGroup, maps.lightmap)
          elementsWithLightmaps.current.push(meshOrGroup)
        }
        if (maps.aomap) {
          addAmbientOcclusion(meshOrGroup, maps.aomap)
          elementsWithAmbientOcclusion.current.push(meshOrGroup)
        }
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) {
            if (maps.lightmap) {
              addLightmap(child, maps.lightmap)
              elementsWithLightmaps.current.push(child)
            }
            if (maps.aomap) {
              addAmbientOcclusion(child, maps.aomap)
              elementsWithAmbientOcclusion.current.push(child)
            }
          }
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

const MapAssetsLoaderInner = () => (
  <Suspense>
    <MapAssets />
  </Suspense>
)

export const MapAssetsLoader = memo(MapAssetsLoaderInner)
