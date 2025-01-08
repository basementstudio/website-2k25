"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame, useLoader } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  Object3D,
  Object3DEventMap,
  Texture,
  Vector3
} from "three"
import { EXRLoader, GLTF } from "three/examples/jsm/Addons.js"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import { animateNet, NET_ANIMATION_SPEED } from "@/utils/basketball-utils"

import { ArcadeScreen } from "../arcade-screen"
import { useAssets } from "../assets-provider"
import { PlayedBasketballs } from "../basketball/played-basketballs"
import { RoutingElement } from "../routing-element"
import { LightmapLoader } from "./lightmaps"

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh
  }
}

export const Map = memo(InnerMap)

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

function InnerMap() {
  const { map, basketballNet } = useAssets()
  const { scene } = useGLTF(map) as unknown as GLTFResult
  const { scene: basketballNetV2 } = useGLTF(basketballNet)

  const [mainScene, setMainScene] = useState<Object3D<Object3DEventMap> | null>(
    null
  )

  const crystals = useRef<Mesh[]>([])

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [basketballHoop, setBasketballHoop] = useState<Object3D | null>(null)

  const [keyframedNet, setKeyframedNet] = useState<Object3D | null>(null)
  const animationProgress = useRef(0)
  const isAnimating = useRef(false)

  const { fogColor, fogDensity, fogDepth } = useControls("fog", {
    fogColor: {
      x: 0.4,
      y: 0.4,
      z: 0.4
    },
    fogDensity: 0.05,
    fogDepth: 9.0
  })

  const { jitter } = useControls("jitter", {
    jitter: 512.0
  })

  // TODO: Remove once we define the final color for the crystals
  const { color, opacity } = useControls("Crystals", {
    color: {
      x: 0.11257215589284897,
      y: 0.11829517036676407,
      z: 0.1276027411222458
    },
    opacity: 0.2909091114997864
  })

  useFrame(({ clock }) => {
    Object.values(shaderMaterialsRef).forEach((material) => {
      material.uniforms.uTime.value = clock.getElapsedTime()

      material.uniforms.fogColor.value = new Vector3(
        fogColor.x,
        fogColor.y,
        fogColor.z
      )
      material.uniforms.fogDensity.value = fogDensity
      material.uniforms.fogDepth.value = fogDepth

      material.uniforms.uJitter.value = jitter
    })

    crystals.current.forEach((crystal) => {
      // @ts-ignore
      crystal.material.uniforms.baseColor.value = new Color(
        color.x,
        color.y,
        color.z
      )
      // @ts-ignore
      crystal.material.uniforms.opacity.value = opacity
    })

    if (keyframedNet && isAnimating.current) {
      const mesh = keyframedNet as Mesh
      animationProgress.current += NET_ANIMATION_SPEED
      isAnimating.current = animateNet(mesh, animationProgress.current)
    }
  })

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}

    CLICKABLE_NODES.forEach((node) => {
      const child = scene.getObjectByName(`${node.name}`)
      if (child) {
        child.removeFromParent()
        routingNodes[node.name] = child as Mesh
      }
    })

    const hoopMesh = scene.getObjectByName("SM_BasketballHoop")
    const newNetMesh = basketballNetV2.getObjectByName("SM_BasketRed-v2")

    if (hoopMesh) {
      hoopMesh.removeFromParent()
      setBasketballHoop(hoopMesh)
    }

    const originalNet = scene.getObjectByName("SM_BasketRed")
    if (originalNet) {
      originalNet.removeFromParent()
    }

    if (newNetMesh) {
      newNetMesh.removeFromParent()
      setKeyframedNet(newNetMesh)
    }

    scene.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh

        const ommitNode = Boolean(
          CLICKABLE_NODES.find((n) => n.name === meshChild.name)?.name
        )
        if (ommitNode) return
        const alreadyReplaced = meshChild.userData.hasGlobalMaterial

        if (alreadyReplaced) return

        const currentMaterial = meshChild.material
        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) =>
              createGlobalShaderMaterial(
                material as MeshStandardMaterial,
                false
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false
            )

        // @ts-ignore
        if (meshChild.material.name === "BSM_MTL_Glass") {
          crystals.current.push(meshChild)
        }

        meshChild.material = newMaterials

        meshChild.userData.hasGlobalMaterial = true
      }
    })

    setMainScene(scene)

    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes
    }))
  }, [scene, basketballNetV2])

  useEffect(() => {
    const handleScore = () => {
      isAnimating.current = true
      animationProgress.current = 0
    }

    window.addEventListener("basketball-score", handleScore)
    return () => window.removeEventListener("basketball-score", handleScore)
  }, [])

  if (!mainScene) return null

  return (
    <group>
      <primitive object={mainScene} />
      <ArcadeScreen />
      {Object.values(routingNodes).map((node) => (
        <RoutingElement key={node.name} node={node} />
      ))}
      {basketballHoop && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={basketballHoop} />
        </RigidBody>
      )}

      {keyframedNet && <primitive object={keyframedNet} />}
      <PlayedBasketballs />
      <LightmapLoader />
    </group>
  )
}
