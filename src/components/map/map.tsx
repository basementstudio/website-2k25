"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { useControls, folder as levaFolder } from "leva"
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
import { useNavigationStore } from "../navigation-handler/navigation-store"
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

export const Map = memo(() => {
  const {
    office: officePath,
    outdoor: outdoorPath,
    godrays: godraysPath,
    basketballNet: basketballNetPath,
    routingElements: routingElementsPath,
    videos
  } = useAssets()
  const currentScene = useNavigationStore((state) => state.currentScene)
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

  const [godrays, setGodrays] = useState<Mesh[]>([])
  useGodrays({ godrays })

  const [car, setCar] = useState<Mesh | null>(null)
  useCarAnimation({ car })

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [basketballHoop, setBasketballHoop] = useState<Object3D | null>(null)
  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})
  const [keyframedNet, setKeyframedNet] = useState<Object3D | null>(null)

  const animationProgress = useRef(0)
  const isAnimating = useRef(false)
  const { fogColor, fogDensity, fogDepth } = useControls({
    fog: levaFolder(
      {
        fogColor: {
          x: 0.4,
          y: 0.4,
          z: 0.4
        },
        fogDensity: 0.05,
        fogDepth: 9.0
      },
      {
        collapsed: true
      }
    )
  })

  const colorPickerRef = useRef<Mesh>(null)
  const { showColorPicker } = useControls({
    "color picker": levaFolder(
      {
        showColorPicker: false
      },
      {
        collapsed: true
      }
    )
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
    routingElementsModel.traverse((child) => {
      if (child instanceof Mesh) {
        const matchingTab = currentScene?.tabs?.find((tab) =>
          child.name.includes(tab.tabClickableName)
        )

        if (matchingTab) {
          routingNodes[matchingTab.tabClickableName] = child
        }
      }
    })

    setRoutingNodes(routingNodes)

    const hoopMesh = officeModel.getObjectByName("SM_BasketballHoop")
    const originalNet = officeModel.getObjectByName("SM_BasketRed")
    const newNetMesh = basketballNetModel.getObjectByName("SM_BasketRed-v2")

    const carMesh = outdoorModel.getObjectByName("car01")

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

        const alreadyReplaced = meshChild.userData.hasGlobalMaterial
        if (alreadyReplaced) return

        const currentMaterial = meshChild.material as MeshStandardMaterial
        if (currentMaterial.map) {
          currentMaterial.map.generateMipmaps = false
          currentMaterial.map.magFilter = THREE.NearestFilter
          currentMaterial.map.minFilter = THREE.NearestFilter
        }

        const video = videos.find((video) => video.mesh === meshChild.name)

        if (video) {
          const videoTexture = createVideoTexture(video.url)

          currentMaterial.map = videoTexture
          currentMaterial.map.flipY = false

          currentMaterial.map.generateMipmaps = false
          currentMaterial.map.magFilter = THREE.NearestFilter
          currentMaterial.map.minFilter = THREE.NearestFilter

          currentMaterial.emissiveMap = videoTexture
          currentMaterial.emissiveIntensity = video.intensity
          currentMaterial.emissiveMap.generateMipmaps = false
          currentMaterial.emissiveMap.magFilter = THREE.NearestFilter
          currentMaterial.emissiveMap.minFilter = THREE.NearestFilter
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

    routingElementsModel.traverse((child) => traverse(child))

    outdoorModel.traverse((child) => traverse(child))

    godrayModel.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh
        const alreadyReplaced = meshChild.userData.hasGlobalMaterial
        if (alreadyReplaced) return

        const currentMaterial = meshChild.material as MeshStandardMaterial

        if (currentMaterial.map) {
          currentMaterial.map.generateMipmaps = false
          currentMaterial.map.magFilter = THREE.NearestFilter
          currentMaterial.map.minFilter = THREE.NearestFilter
        }

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
  }, [
    officeModel,
    outdoorModel,
    godrayModel,
    basketballNetModel,
    routingElementsModel,
    videos,
    currentScene
  ])

  useEffect(() => {
    const handleScore = () => {
      isAnimating.current = true
      animationProgress.current = 0
    }

    window.addEventListener("basketball-score", handleScore)
    return () => window.removeEventListener("basketball-score", handleScore)
  }, [])

  if (!officeScene || !outdoorScene || !godrayScene) return null

  return (
    <group>
      <primitive object={officeScene} />
      <primitive object={outdoorScene} />
      <primitive object={godrayScene} />
      <ArcadeScreen />
      {basketballHoop && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={basketballHoop} />
        </RigidBody>
      )}
      {Object.values(routingNodes).map((node) => {
        const matchingTab = currentScene?.tabs?.find(
          (tab) => tab.tabClickableName === node.name
        )

        return (
          <RoutingElement
            key={node.name}
            node={node}
            route={matchingTab?.tabRoute ?? ""}
            hoverName={matchingTab?.tabHoverName ?? node.name}
          />
        )
      })}
      {keyframedNet && <primitive object={keyframedNet} />}
      {car && <primitive position-x={-8.7} object={car} />}
      <PlayedBasketballs />
      <MapAssetsLoader />
      <ReflexesLoader />
    </group>
  )
})

Map.displayName = "Map"
