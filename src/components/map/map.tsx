"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { folder as levaFolder, useControls } from "leva"
import { memo, Suspense, useEffect, useRef, useState } from "react"
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
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"

import { ArcadeScreen } from "../arcade-screen"
import { useAssets } from "../assets-provider"
import Cars from "../cars/cars"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { RoutingElement } from "../routing-element/routing-element"
import { MapAssetsLoader } from "./map-assets"
import { ReflexesLoader } from "./reflexes"
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

// Constants moved outside component
const STAIRS_VISIBILITY_THRESHOLD = 1.8
const frustum = new THREE.Frustum()
const projScreenMatrix = new THREE.Matrix4()

export const Map = memo(() => {
  const {
    office: officePath,
    outdoor: outdoorPath,
    godrays: godraysPath,
    basketballNet: basketballNetPath,
    routingElements: routingElementsPath,
    videos,
    car,
    scenes
  } = useAssets()

  const scene = useCurrentScene()
  const currentScene = useNavigationStore((state) => state.currentScene)
  const mainCamera = useNavigationStore((state) => state.mainCamera)
  const { scene: officeModel } = useGLTF(officePath) as unknown as GLTFResult
  const { scene: outdoorModel } = useGLTF(outdoorPath) as unknown as GLTFResult
  const { scene: godrayModel } = useGLTF(godraysPath) as unknown as GLTFResult
  const { scene: basketballNetModel } = useGLTF(basketballNetPath)
  const { scene: routingElementsModel } = useGLTF(
    routingElementsPath
  ) as unknown as GLTFResult
  const { scene: carV5 } = useGLTF(car.carModel) as unknown as GLTFResult

  const [officeScene, setOfficeScene] = useState<SceneType>(null)
  const [outdoorScene, setOutdoorScene] = useState<SceneType>(null)
  const [godrayScene, setGodrayScene] = useState<SceneType>(null)

  const [godrays, setGodrays] = useState<Mesh[]>([])
  useGodrays({ godrays })

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})
  const [keyframedNet, setKeyframedNet] = useState<Object3D | null>(null)

  const animationProgress = useRef(0)
  const isAnimating = useRef(false)

  const stairsRef = useRef<Mesh | null>(null)
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

    if (!stairsRef.current || !mainCamera) return

    projScreenMatrix.multiplyMatrices(
      mainCamera.projectionMatrix,
      mainCamera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(projScreenMatrix)

    const distance = mainCamera.position.distanceTo(stairsRef.current.position)
    stairsRef.current.visible =
      distance > STAIRS_VISIBILITY_THRESHOLD ||
      frustum.containsPoint(stairsRef.current.position)
  })

  useEffect(() => {
    if (!scene || !scenes) return

    const normalizedSceneName =
      scene.toLowerCase() === "/" ? "home" : scene.toLowerCase()

    const currentSceneConfig = scenes.find(
      (sceneData) =>
        sceneData.name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        normalizedSceneName.replace(/[^a-z0-9]/g, "")
    )

    if (!currentSceneConfig) {
      useCustomShaderMaterial
        .getState()
        .updateFogSettings(new Vector3(0.4, 0.4, 0.4), 0.05, 9)
      return
    }

    useCustomShaderMaterial
      .getState()
      .updateFogSettings(
        new Vector3(
          currentSceneConfig.fogConfig.fogColor.r,
          currentSceneConfig.fogConfig.fogColor.g,
          currentSceneConfig.fogConfig.fogColor.b
        ),
        currentSceneConfig.fogConfig.fogDensity,
        currentSceneConfig.fogConfig.fogDepth
      )
  }, [scene, scenes])

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}
    routingElementsModel?.traverse((child) => {
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

    const originalNet = officeModel?.getObjectByName("SM_BasketRed")
    const newNetMesh = basketballNetModel?.getObjectByName("SM_BasketRed-v2")

    if (originalNet?.parent) {
      originalNet.removeFromParent()
    }

    if (newNetMesh?.parent) {
      newNetMesh.removeFromParent()
      setKeyframedNet(newNetMesh)
    }

    const car = carV5?.children.find((child) => child.name === "CAR") as Mesh
    const backWheel = carV5?.children.find(
      (child) => child.name === "BACK-WHEEL"
    ) as Mesh
    const frontWheel = carV5?.children.find(
      (child) => child.name === "FRONT-WHEEL"
    ) as Mesh

    if (backWheel && car && frontWheel) {
      useMesh.setState({
        carMeshes: { backWheel, car, frontWheel }
      })
    }

    const traverse = (child: Object3D) => {
      if (child.name === "SM_StairsFloor" && child instanceof THREE.Mesh) {
        child.material.side = THREE.FrontSide
      }

      if (child.name === "SM_Stair3" && child instanceof THREE.Mesh) {
        stairsRef.current = child
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
          currentMaterial.name === "BSM_MTL_LightLibrary" ||
          currentMaterial.name === "BSM-MTL-Backup"

        const isPlant = meshChild.name === "SM_plant01001"

        if (isPlant) {
          currentMaterial.userData.lightDirection = new Vector3(
            0,
            3,
            1
          ).normalize()
        }

        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) =>
              createGlobalShaderMaterial(
                material as MeshStandardMaterial,
                false,
                {
                  GLASS: isGlass,
                  GODRAY: false,
                  LIGHT: isPlant
                }
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false,
              {
                GLASS: isGlass,
                GODRAY: false,
                LIGHT: isPlant
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

    const hoopMesh = officeModel.getObjectByName(
      "SM_BasketballHoop"
    ) as Mesh | null
    if (hoopMesh) {
      hoopMesh.removeFromParent()
      hoopMesh.raycast = () => null
      useMesh.setState({ hoopMesh })
    }

    const netMesh = basketballNetModel.getObjectByName("Net") as Mesh | null
    if (netMesh) {
      netMesh.raycast = () => null
    }

    const disableRaycasting = (scene: THREE.Object3D) => {
      scene.traverse((child) => {
        if ("isMesh" in child) {
          const meshChild = child as Mesh
          if (meshChild.name === "SM_ArcadeLab_Screen") return
          meshChild.raycast = () => null
        }
      })
    }

    disableRaycasting(officeModel)
    disableRaycasting(outdoorModel)
    disableRaycasting(godrayModel)
  }, [
    officeModel,
    outdoorModel,
    godrayModel,
    basketballNetModel,
    routingElementsModel,
    videos,
    currentScene,
    carV5
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
      {scene !== "basketball" && useMesh.getState().hoopMesh && (
        <primitive object={useMesh.getState().hoopMesh as Mesh} />
      )}
      {keyframedNet && <primitive object={keyframedNet} />}
      <MapAssetsLoader />
      <ReflexesLoader />

      <Suspense fallback={null}>
        <Cars />
      </Suspense>
    </group>
  )
})

Map.displayName = "Map"
