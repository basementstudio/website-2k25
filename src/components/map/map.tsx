"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { usePathname } from "next/navigation"
import { memo, useEffect, useRef, useState } from "react"
import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Object3DEventMap,
  Vector3
} from "three"
import * as THREE from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"
import { useGameAudio } from "@/hooks/use-game-audio"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import { animateNet, NET_ANIMATION_SPEED } from "@/utils/basketball-utils"
import { animateCar } from "@/utils/map-utils"

import { ArcadeScreen } from "../arcade-screen"
import { useAssets } from "../assets-provider"
import { PlayedBasketballs } from "../basketball/played-basketballs"
import { RoutingElement } from "../routing-element"
import { LightmapLoader } from "./lightmaps"
import { ReflexesLoader } from "./reflexes"

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh
  }
}

const createVideoTexture = (url: string) => {
  const videoElement = document.createElement("video")
  videoElement.src = url
  videoElement.loop = true
  videoElement.muted = true
  videoElement.crossOrigin = "anonymous"
  videoElement.play()

  return new THREE.VideoTexture(videoElement)
}

export const Map = memo(() => {
  const { map, basketballNet, videos } = useAssets()
  const { scene } = useGLTF(map) as unknown as GLTFResult
  const { scene: basketballNetV2 } = useGLTF(basketballNet)
  const pathname = usePathname()
  const { playSoundFX } = useGameAudio()

  const [mainScene, setMainScene] = useState<Object3D<Object3DEventMap> | null>(
    null
  )

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [basketballHoop, setBasketballHoop] = useState<Object3D | null>(null)
  const [keyframedNet, setKeyframedNet] = useState<Object3D | null>(null)
  const [car, setCar] = useState<Object3D | null>(null)

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

    if (keyframedNet && isAnimating.current) {
      const mesh = keyframedNet as Mesh
      animationProgress.current += NET_ANIMATION_SPEED
      isAnimating.current = animateNet(mesh, animationProgress.current)
    }

    if (car) {
      const mesh = car as Mesh
      animationProgress.current += clock.getElapsedTime()
      animateCar(mesh, animationProgress.current, pathname, playSoundFX)
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
    const carMesh = scene.getObjectByName("Car01")

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

    if (carMesh) {
      carMesh.removeFromParent()
      setCar(carMesh)
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

        const currentMaterial = meshChild.material as MeshStandardMaterial

        const video = videos.find((video) => video.mesh === meshChild.name)

        if (video) {
          const videoTexture = createVideoTexture(video.url)

          currentMaterial.map = videoTexture
          currentMaterial.emissiveMap = videoTexture
        }

        const isGlass =
          currentMaterial.name === "BSM_MTL_Glass" ||
          currentMaterial.name === "BSM_MTL_LightLibrary"

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

        meshChild.material = newMaterials

        // @ts-ignore
        if (isGlass) meshChild.material.uniforms.isGlass.value = true

        meshChild.userData.hasGlobalMaterial = true
      }
    })

    setMainScene(scene)

    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes
    }))
  }, [scene, basketballNetV2, videos])

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

      {car && <primitive position-x={-8.7} object={car} />}
      <PlayedBasketballs />
      <LightmapLoader />
      <ReflexesLoader />
    </group>
  )
})

Map.displayName = "Map"
