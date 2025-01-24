"use client"

import { useLoader, useThree } from "@react-three/fiber"
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

import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

import { useAssets } from "../assets-provider"

function useReflexes(): Record<string, Texture> {
  const { glassReflexes } = useAssets()

  const loadedMaps = useLoader(
    TextureLoader,
    glassReflexes.map((reflex) => reflex.url)
  )

  const reflexes = useMemo(() => {
    return loadedMaps.reduce(
      (acc, map, index) => {
        map.flipY = true
        map.magFilter = NearestFilter
        map.colorSpace = NoColorSpace
        acc[glassReflexes[index].mesh] = map
        return acc
      },
      {} as Record<string, Texture>
    )
  }, [glassReflexes, loadedMaps])

  return reflexes
}

function Reflexes() {
  const reflexes = useReflexes()

  const scene = useThree((state) => state.scene)

  useEffect(() => {
    function addReflex(mesh: Mesh, reflex: Texture) {
      if (!mesh.userData.hasGlobalMaterial) return

      const material = mesh.material as ShaderMaterial
      material.uniforms.glassReflex.value = reflex
    }

    Object.entries(reflexes).forEach(([mesh, reflex]) => {
      const meshOrGroup = scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        addReflex(meshOrGroup, reflex)
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) {
            addReflex(child, reflex)
          }
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

const ReflexesLoaderInner = () => (
  <Suspense>
    <Reflexes />
  </Suspense>
)

export const ReflexesLoader = memo(ReflexesLoaderInner)
