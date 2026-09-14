"use client"

import * as THREE from "three"
import { Mesh, MeshStandardMaterial, Object3D } from "three"

import { useAssets } from "@/components/assets-provider"
import { CITY_POSITION, CITY_SCALE } from "@/components/city-skyline"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { useMesh } from "@/hooks/use-mesh"
import { createVideoTextureWithResume } from "@/hooks/use-video-resume"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { createNotFoundMaterial } from "@/shaders/material-not-found"

const legacySkyNodes = ["TX_Sky001", "TX_Sky002", "cloudy_01", "cloudy_02"]
export const usePrepareMapMaterials = () => {
  const { videos, matcaps, glassMaterials, doubleSideElements } = useAssets()
  return (
    child: Object3D,
    overrides?: { FOG?: boolean; GODRAY?: boolean; OUTDOOR?: boolean }
  ) => {
    if (legacySkyNodes.includes(child.name)) {
      child.visible = false
      return
    }

    if (child.name === "SM_TvScreen_4" && "isMesh" in child) {
      const meshChild = child as Mesh
      useMesh.setState({ cctv: { screen: meshChild } })
      const texture = cctvConfig.renderTarget.read.texture

      const diffuseUniform = { value: texture }

      cctvConfig.renderTarget.onSwap(() => {
        diffuseUniform.value = cctvConfig.renderTarget.read.texture
      })

      meshChild.material = createNotFoundMaterial(diffuseUniform)

      return
    }

    if ("isMesh" in child) {
      const meshChild = child as Mesh

      if (meshChild.name !== "SM_ArcadeLab_Screen") {
        meshChild.raycast = () => null
      }

      const alreadyReplaced = meshChild.userData.hasGlobalMaterial
      if (alreadyReplaced) return

      const currentMaterial = meshChild.material as MeshStandardMaterial

      const withVideo = videos.find((video) => video.mesh === meshChild.name)
      const withMatcap = matcaps?.find((m) => m.mesh === meshChild.name)
      const isGlass = glassMaterials.includes(currentMaterial.name)
      const isCity = meshChild.name === "TX_Building"
      const isDaylight = meshChild.name === "DL_ScreenB"

      currentMaterial.side = doubleSideElements.includes(meshChild.name)
        ? THREE.DoubleSide
        : THREE.FrontSide

      if (withVideo) {
        const videoTexture = createVideoTextureWithResume(withVideo.url)
        meshChild.userData.sceneVideo = videoTexture

        // Clean up old video texture if it exists
        if (currentMaterial.map && "video" in (currentMaterial.map as any)) {
          const oldTexture = currentMaterial.map as THREE.VideoTexture
          if (oldTexture.userData && oldTexture.userData.cleanup) {
            oldTexture.userData.cleanup()
          }
          oldTexture.dispose()
        }

        currentMaterial.map = videoTexture
        currentMaterial.map.flipY = false
        currentMaterial.emissiveMap = videoTexture
        currentMaterial.emissiveIntensity = withVideo.intensity
      }

      if (currentMaterial.map) {
        currentMaterial.map.generateMipmaps = false
        currentMaterial.map.magFilter = THREE.NearestFilter
        currentMaterial.map.minFilter =
          currentMaterial.map.mipmaps.length > 1
            ? THREE.LinearMipmapLinearFilter
            : THREE.LinearFilter
      }

      const CONFIG = {
        GLASS: isGlass,
        LIGHT: false,
        GODRAY: overrides?.GODRAY,
        FOG: overrides?.FOG,
        MATCAP: withMatcap !== undefined,
        VIDEO: withVideo !== undefined,
        OUTDOOR: overrides?.OUTDOOR,
        CITY: isCity,
        DAYLIGHT: isDaylight,
        IS_LOBO_MARINO: meshChild.name === "SM_Lobo"
      }

      const newMaterials = Array.isArray(currentMaterial)
        ? currentMaterial.map((material) =>
            createGlobalShaderMaterial(material, CONFIG)
          )
        : createGlobalShaderMaterial(currentMaterial, CONFIG)

      if (isGlass) {
        Array.isArray(newMaterials)
          ? newMaterials.forEach((material) => {
              material.depthWrite = false
            })
          : (newMaterials.depthWrite = false)
      }

      meshChild.material = newMaterials

      if (meshChild.name === "SM_Glass_Dust" && !Array.isArray(newMaterials)) {
        newMaterials.uniforms.opacity.value =
          (newMaterials.uniforms.opacity.value as number) * 0.5
      }

      if (isCity && !Array.isArray(newMaterials)) {
        meshChild.position.set(...CITY_POSITION)
        meshChild.scale.setX(CITY_SCALE.x)
        meshChild.scale.setY(CITY_SCALE.y)
        useMesh.setState({
          city: { material: newMaterials, mesh: meshChild }
        })
      }

      meshChild.userData.hasGlobalMaterial = true
    }
  }
}
