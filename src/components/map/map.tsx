"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
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

import {
  animateNet,
  NET_ANIMATION_SPEED
} from "@/components/basketball/basketball-utils"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"

import { ArcadeScreen } from "../arcade-screen"
import { useAssets } from "../assets-provider"
import { PlayedBasketballs } from "../basketball/played-basketballs"
import { RoutingElement } from "../routing-element/routing-element"
import { MapAssetsLoader } from "./map-assets"
import { ReflexesLoader } from "./reflexes"
import { useCarAnimation } from "./use-car-animation"
import { useGodrays } from "./use-godrays"

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

type SceneType = Object3D<Object3DEventMap> | null

interface clickable {
  name: string
  frameData: any
  node: Mesh
  arrowData: any
  route: string
}

export const Map = memo(() => {
  const {
    office: officePath,
    outdoor: outdoorPath,
    godrays: godraysPath,
    basketballNet: basketballNetPath,
    routingElements: routingElementsPath,
    videos,
    clickables: clickablesList
  } = useAssets()

  const { scene: officeModel } = useGLTF(officePath) as unknown as GLTFResult
  const { scene: outdoorModel } = useGLTF(outdoorPath) as unknown as GLTFResult
  const { scene: godrayModel } = useGLTF(godraysPath) as unknown as GLTFResult
  const { scene: basketballNetModel } = useGLTF(basketballNetPath)
  const { scene: routingElementsModel } = useGLTF(
    routingElementsPath
  ) as unknown as GLTFResult

  const [officeScene, setOfficeScene] = useState<SceneType>(null)
  const [outdoorScene, setOutdoorScene] = useState<SceneType>(null)
  const [godrayScene, setGodrayScene] = useState<SceneType>(null)

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})
  const [clickables, setClickables] = useState<Record<string, clickable>>({})

  const [godrays, setGodrays] = useState<Mesh[]>([])
  useGodrays({ godrays })

  const [car, setCar] = useState<Mesh | null>(null)
  useCarAnimation({ car })

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

  const colorPickerRef = useRef<Mesh>(null)
  const { showColorPicker } = useControls("color picker", {
    showColorPicker: false
  })

  const { godraysOpacity } = useControls("godrays", {
    godraysOpacity: {
      value: 0.5,
      min: 0.0,
      max: 5.0,
      step: 0.001
    }
  })

  useFrame(({ clock }) => {
    godrays.forEach((mesh) => {
      // @ts-ignore
      mesh.material.uniforms.uGodrayDensity.value = godraysOpacity
    })

    Object.values(shaderMaterialsRef).forEach((material) => {
      material.uniforms.uTime.value = clock.getElapsedTime()

      material.uniforms.fogColor.value = new Vector3(
        fogColor.x,
        fogColor.y,
        fogColor.z
      )
      material.uniforms.fogDensity.value = fogDensity
      material.uniforms.fogDepth.value = fogDepth
    })

    if (keyframedNet && isAnimating.current) {
      const mesh = keyframedNet as Mesh
      animationProgress.current += NET_ANIMATION_SPEED
      isAnimating.current = animateNet(mesh, animationProgress.current)
    }

    if (colorPickerRef.current) {
      // @ts-ignore
      colorPickerRef.current.material.uniforms.opacity.value = showColorPicker
        ? 1.0
        : 0.0
    }
  })

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}

    clickablesList.forEach((node) => {
      const child = routingElementsModel.getObjectByName(node.title)
      if (child) {
        child.removeFromParent()
        routingNodes[node.title] = child as Mesh
      }
    })

    const hoopMesh = officeModel.getObjectByName("SM_BasketballHoop")
    const originalNet = officeModel.getObjectByName("SM_BasketRed")
    const newNetMesh = basketballNetModel.getObjectByName("SM_BasketRed-v2")

    const carMesh = outdoorModel.getObjectByName("Car01")

    if (hoopMesh) setBasketballHoop(hoopMesh)
    if (originalNet) originalNet.removeFromParent()
    if (newNetMesh) {
      newNetMesh.removeFromParent()
      setKeyframedNet(newNetMesh)
    }
    if (carMesh) setCar(carMesh as Mesh)

    const traverse = (child: Object3D) => {
      if (child.name === "SM_StairsFloor" && child instanceof THREE.Mesh) {
        child.material.side = THREE.FrontSide
      }

      if ("isMesh" in child) {
        const meshChild = child as Mesh

        if (meshChild.name === "SM_ColorChecker_")
          colorPickerRef.current = meshChild

        const ommitNode = Boolean(
          clickablesList.find((n) => n.title === meshChild.name)?.title
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
          currentMaterial.emissiveIntensity = video.intensity
        }

        const isGlass =
          currentMaterial.name === "BSM_MTL_Glass" ||
          currentMaterial.name === "BSM_MTL_LightLibrary"

        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) =>
              createGlobalShaderMaterial(
                material as MeshStandardMaterial,
                false,
                {
                  GLASS: isGlass,
                  GODRAY: false
                }
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false,
              {
                GLASS: isGlass,
                GODRAY: false
              }
            )

        meshChild.material = newMaterials

        meshChild.userData.hasGlobalMaterial = true
      }
    }

    officeModel.traverse((child) => traverse(child))

    outdoorModel.traverse((child) => traverse(child))

    godrayModel.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh
        const alreadyReplaced = meshChild.userData.hasGlobalMaterial
        if (alreadyReplaced) return

        const currentMaterial = meshChild.material as MeshStandardMaterial

        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) =>
              createGlobalShaderMaterial(
                material as MeshStandardMaterial,
                false,
                {
                  GODRAY: true
                }
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false,
              {
                GODRAY: true
              }
            )

        meshChild.material = newMaterials
        meshChild.userData.hasGlobalMaterial = true
        setGodrays((prev) => [...prev, meshChild])
      }
    })

    setOfficeScene(officeModel)
    setOutdoorScene(outdoorModel)
    setGodrayScene(godrayModel)
    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes
    }))
  }, [
    officeModel,
    outdoorModel,
    godrayModel,
    basketballNetModel,
    routingElementsModel,
    videos,
    clickablesList
  ])

  useEffect(() => {
    const handleScore = () => {
      isAnimating.current = true
      animationProgress.current = 0
    }

    window.addEventListener("basketball-score", handleScore)
    return () => window.removeEventListener("basketball-score", handleScore)
  }, [])

  useEffect(() => {
    const clickablesElements = clickablesList.reduce((acc, clickable) => {
      const node = routingNodes[clickable.title]
      // Only add to clickables if node exists
      if (!node) return acc

      return {
        ...acc,
        [clickable.title]: {
          name: clickable.title,
          route: clickable.route,
          frameData: {
            position: clickable.framePosition,
            rotation: clickable.frameRotation,
            size: clickable.frameSize,
            hoverName: clickable.hoverName
          },
          arrowData: {
            position: clickable.arrowPosition,
            scale: clickable.arrowScale,
            rotation: clickable.arrowRotation
          },
          node
        }
      }
    }, {})

    setClickables(clickablesElements)
  }, [clickablesList, routingNodes])

  if (!officeScene || !outdoorScene || !godrayScene) return null

  return (
    <group>
      <primitive object={officeScene} />
      <primitive object={outdoorScene} />
      <primitive object={godrayScene} />
      <ArcadeScreen />
      {Object.values(clickables).map(
        ({ frameData, name, node, arrowData, route }) => (
          <RoutingElement
            key={name}
            node={node}
            route={route}
            frameData={frameData}
            arrowData={arrowData}
          />
        )
      )}
      {basketballHoop && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={basketballHoop} />
        </RigidBody>
      )}

      {keyframedNet && <primitive object={keyframedNet} />}
      {car && <primitive position-x={-8.7} object={car} />}
      <PlayedBasketballs />
      <MapAssetsLoader />
      <ReflexesLoader />
    </group>
  )
})

Map.displayName = "Map"
