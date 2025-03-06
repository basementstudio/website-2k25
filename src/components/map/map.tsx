"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { animate, MotionValue } from "motion"
import { AnimationPlaybackControls } from "motion/react"
import dynamic from "next/dynamic"
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

import { ArcadeBoard } from "@/components/arcade-board"
import { ArcadeScreen } from "@/components/arcade-screen"
import { useAssets } from "@/components/assets-provider"
import {
  animateNet,
  NET_ANIMATION_SPEED
} from "@/components/basketball/basketball-utils"
import { BlogDoor } from "@/components/blog-door"
import { useInspectable } from "@/components/inspectables/context"
import { Lamp } from "@/components/lamp"
import { LockedDoor } from "@/components/locked-door"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { RoutingElement } from "@/components/routing-element/routing-element"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import notFoundFrag from "@/shaders/not-found/not-found.frag"

import { Net } from "../basketball/net"
import { OutdoorCars } from "../outdoor-cars"
import { BakesLoader } from "./bakes"
import { ReflexesLoader } from "./reflexes"
import { useGodrays } from "./use-godrays"

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh
  }
}

const PhysicsWorld = dynamic(
  () =>
    import("@react-three/rapier").then((mod) => {
      const { Physics } = mod
      return function PhysicsWrapper({
        children,
        paused,
        gravity
      }: {
        children: React.ReactNode
        paused: boolean
        gravity: [number, number, number]
      }) {
        return (
          <Physics paused={paused} gravity={gravity}>
            {children}
          </Physics>
        )
      }
    }),
  { ssr: false }
)

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
    inspectables: inspectableAssets,
    videos,
    scenes,
    outdoorCars,
    matcaps
  } = useAssets()
  const firstRender = useRef(true)
  const scene = useCurrentScene()
  const currentScene = useNavigationStore((state) => state.currentScene)
  const mainCamera = useNavigationStore((state) => state.mainCamera)
  const { scene: officeModel } = useGLTF(officePath) as unknown as GLTFResult
  const { scene: outdoorModel } = useGLTF(outdoorPath) as unknown as GLTFResult
  const { scene: godrayModel } = useGLTF(godraysPath) as unknown as GLTFResult
  const { scene: outdoorCarsModel } = useGLTF(
    outdoorCars.model
  ) as unknown as GLTFResult
  const { scene: basketballNetModel } = useGLTF(basketballNetPath)
  const { scene: routingElementsModel } = useGLTF(
    routingElementsPath
  ) as unknown as GLTFResult

  const [officeScene, setOfficeScene] = useState<SceneType>(null)
  const [outdoorScene, setOutdoorScene] = useState<SceneType>(null)
  const [godrayScene, setGodrayScene] = useState<SceneType>(null)

  const { selected } = useInspectable()

  const [godrays, setGodrays] = useState<Mesh[]>([])
  useGodrays({ godrays })

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})
  const [keyframedNet, setKeyframedNet] = useState<Object3D | null>(null)
  const [net, setNet] = useState<Mesh | null>(null)

  const animationProgress = useRef(0)
  const isAnimating = useRef(false)
  const timeRef = useRef(0)

  const stairsRef = useRef<Mesh | null>(null)

  const { godrayOpacity } = useControls("God Rays", {
    godrayOpacity: {
      value: 1.25,
      min: 0.0,
      max: 5.0,
      step: 0.001
    }
  })

  const fadeFactor = useRef(new MotionValue())
  const inspectingEnabled = useRef(false)
  const tl = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    const easeDirection = selected ? 1 : 0

    if (easeDirection === 1) inspectingEnabled.current = true

    tl.current = animate(fadeFactor.current, easeDirection, ANIMATION_CONFIG)
    tl.current.play()

    return () => tl.current?.stop()
  }, [selected])

  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime()

    Object.values(shaderMaterialsRef).forEach((material) => {
      material.uniforms.uTime.value = clock.getElapsedTime()

      material.uniforms.inspectingEnabled.value = inspectingEnabled.current
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
    })

    if (useMesh.getState().cctv?.screen?.material) {
      // @ts-ignore
      useMesh.getState().cctv.screen.material.uniforms.uTime.value =
        clock.getElapsedTime()
    }

    if (keyframedNet && isAnimating.current) {
      const mesh = keyframedNet as Mesh
      animationProgress.current += NET_ANIMATION_SPEED
      isAnimating.current = animateNet(mesh, animationProgress.current)
    }

    godrays.forEach((mesh) => {
      // @ts-ignore
      mesh.material.uniforms.uGodrayDensity.value = godrayOpacity
    })

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
    const fogConfig = scenes.find((s) => s.name === scene)?.fogConfig

    if (!fogConfig) return

    useCustomShaderMaterial.getState().updateFogSettings(
      {
        color: new Vector3(
          fogConfig.fogColor.r,
          fogConfig.fogColor.g,
          fogConfig.fogColor.b
        ),
        density: fogConfig.fogDensity,
        depth: fogConfig.fogDepth
      },
      firstRender.current
    )

    firstRender.current = false

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}
    routingElementsModel?.traverse((child) => {
      if (child instanceof Mesh) {
        const matchingTab = currentScene?.tabs?.find(
          (tab) => child.name === tab.tabClickableName
        )

        if (matchingTab) {
          routingNodes[matchingTab.tabClickableName] = child
        }
      }
    })

    setRoutingNodes(routingNodes)

    const originalNet = officeModel?.getObjectByName("SM_BasketRed")
    const newNetMesh = basketballNetModel?.getObjectByName("SM_BasketRed-v2")

    if (newNetMesh?.parent) {
      newNetMesh.removeFromParent()
    }

    if (originalNet?.parent) {
      originalNet.removeFromParent()
      setNet(originalNet as Mesh)
    }

    // const car = carV5?.children.find((child) => child.name === "CAR") as Mesh
    // const backWheel = carV5?.children.find(
    //   (child) => child.name === "BACK-WHEEL"
    // ) as Mesh
    // const frontWheel = carV5?.children.find(
    //   (child) => child.name === "FRONT-WHEEL"
    // ) as Mesh

    // if (backWheel && car && frontWheel) {
    //   useMesh.setState({
    //     carMeshes: { backWheel, car, frontWheel }
    //   })
    // }

    const traverse = (
      child: Object3D,
      overrides?: { FOG?: boolean; GODRAY?: boolean }
    ) => {
      if (child.name === "SM_TvScreen_4" && "isMesh" in child) {
        const meshChild = child as Mesh
        useMesh.setState({ cctv: { screen: meshChild } })
        const texture = cctvConfig.renderTarget.read.texture

        const diffuseUniform = {
          value: texture
        }

        cctvConfig.renderTarget.onSwap(() => {
          diffuseUniform.value = cctvConfig.renderTarget.read.texture
        })

        meshChild.material = new THREE.ShaderMaterial({
          side: THREE.DoubleSide,
          uniforms: {
            tDiffuse: diffuseUniform,
            uTime: { value: timeRef.current },
            resolution: { value: new THREE.Vector2(1024, 1024) }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: notFoundFrag
        })
        return
      }

      if (child.name === "SM_StairsFloor" && child instanceof THREE.Mesh) {
        child.material.side = THREE.FrontSide
      }

      if (child.name === "SM_Stair3" && child instanceof THREE.Mesh) {
        stairsRef.current = child
      }

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

        const video = videos.find((video) => video.mesh === meshChild.name)

        const matcap = matcaps?.find((matcap) => matcap.mesh === meshChild.name)

        const clouds = meshChild.name === "cloudy_01"

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
          currentMaterial.name === "BSM-MTL-Backup" ||
          currentMaterial.name === "MTL_LightBox"

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
                  LIGHT: isPlant,
                  GODRAY: overrides?.GODRAY,
                  FOG: overrides?.FOG,
                  MATCAP: matcap !== undefined,
                  VIDEO: video !== undefined,
                  CLOUDS: clouds
                }
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false,
              {
                GLASS: isGlass,
                LIGHT: isPlant,
                GODRAY: overrides?.GODRAY,
                FOG: overrides?.FOG,
                MATCAP: matcap !== undefined,
                VIDEO: video !== undefined,
                CLOUDS: clouds
              }
            )

        if (isGlass) {
          Array.isArray(newMaterials)
            ? newMaterials.forEach((material) => {
                material.depthWrite = false
              })
            : (newMaterials.depthWrite = false)
        }

        meshChild.material = newMaterials

        meshChild.userData.hasGlobalMaterial = true
      }
    }

    officeModel.traverse((child) => traverse(child))

    routingElementsModel.traverse((child) => traverse(child, { FOG: false }))

    outdoorModel.traverse((child) => traverse(child, { FOG: false }))

    godrayModel.traverse((child) => traverse(child, { GODRAY: true }))

    godrayModel.traverse((child) => {
      if (child instanceof Mesh) setGodrays((prev) => [...prev, child])
    })

    setOfficeScene(officeModel)
    setOutdoorScene(outdoorModel)
    setGodrayScene(godrayModel)

    const hoop = officeModel.getObjectByName("SM_BasketballHoop")
    const hoopGlass = officeModel.getObjectByName("SM_BasketballGlass")

    if (hoop) {
      hoop.raycast = () => null

      if (hoop instanceof Mesh) {
        hoop.visible = true

        if (!hoop.userData.originalMaterial) {
          hoop.userData.originalMaterial = hoop.material
        }
      }

      if (hoopGlass instanceof Mesh) {
        hoopGlass.visible = true

        if (!hoopGlass.userData.originalMaterial) {
          hoopGlass.userData.originalMaterial = hoopGlass.material
        }
      }

      useMesh.setState({
        hoopMeshes: {
          hoop: hoop as Mesh,
          hoopGlass: hoopGlass as Mesh
        }
      })
    }

    const inspectables = useMesh.getState().inspectableMeshes

    if (inspectables.length === 0) {
      const inspectableMeshes: Mesh[] = []

      inspectableAssets.forEach(({ mesh: meshName }) => {
        const mesh = officeModel.getObjectByName(meshName) as Mesh | null
        if (mesh) {
          mesh.userData.position = {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z
          }

          mesh.userData.rotation = {
            x: mesh.rotation.x,
            y: mesh.rotation.y,
            z: mesh.rotation.z
          }

          inspectableMeshes.push(mesh)
        }
      })

      useMesh.setState({ inspectableMeshes })
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

    if (
      !useMesh.getState().arcade.buttons &&
      !useMesh.getState().arcade.sticks
    ) {
      let arcadeButtons: Mesh[] = []
      for (let i = 1; i <= 14; i++) {
        const button = officeModel?.getObjectByName(`02_BT_${i}`) as Mesh
        if (button?.parent) button.removeFromParent()
        button.userData.originalPosition = {
          x: button.position.x,
          y: button.position.y,
          z: button.position.z
        }
        if (button) arcadeButtons.push(button)
      }

      const leftStick = officeModel?.getObjectByName("02_JYTK_L") as Mesh
      if (leftStick?.parent) leftStick.removeFromParent()
      const rightStick = officeModel?.getObjectByName("02_JYTK_R") as Mesh
      if (rightStick?.parent) rightStick.removeFromParent()

      useMesh.setState({
        arcade: {
          buttons: arcadeButtons,
          sticks: [leftStick, rightStick]
        }
      })
    }

    outdoorCarsModel.traverse((child) => traverse(child, { FOG: false }))
    if (
      !useMesh.getState().outdoorCarsMeshes ||
      Object.keys(useMesh.getState().outdoorCarsMeshes).length === 0
    ) {
      const outdoorCarsMeshes: (Mesh | null)[] = []

      outdoorCarsModel.children.forEach((child) => {
        if (child instanceof Mesh) {
          outdoorCarsMeshes.push(child)
        }
      })
      useMesh.setState({ outdoorCarsMeshes })
    }

    if (
      !useMesh.getState().blog.lockedDoor &&
      !useMesh.getState().blog.door &&
      !useMesh.getState().blog.lamp &&
      !useMesh.getState().blog.lampTargets
    ) {
      const lockedDoor = officeModel?.getObjectByName("SM_00_012") as Mesh
      lockedDoor.userData.originalRotation = {
        x: lockedDoor.rotation.x,
        y: lockedDoor.rotation.y,
        z: lockedDoor.rotation.z
      }
      const door = officeModel?.getObjectByName("SM_00_010") as Mesh
      door.userData.originalRotation = {
        x: door.rotation.x,
        y: door.rotation.y,
        z: door.rotation.z
      }

      const lamp = officeModel?.getObjectByName("SM_LightMeshBlog") as Mesh

      if (lockedDoor?.parent) lockedDoor.removeFromParent()
      if (door?.parent) door.removeFromParent()
      if (lamp?.parent) lamp.removeFromParent()

      const lampTargets: Mesh[] = []
      for (let i = 1; i <= 7; i++) {
        const target = officeModel?.getObjectByName(
          `SM_06_0${i}`
        ) as Mesh | null

        if (target) lampTargets.push(target)
      }

      useMesh.setState({
        blog: { lockedDoor, door, lamp, lampTargets }
      })
    }

    disableRaycasting(officeModel)
    disableRaycasting(outdoorModel)
    disableRaycasting(godrayModel)
    disableRaycasting(outdoorCarsModel)
  }, [
    inspectableAssets,
    officeModel,
    outdoorModel,
    godrayModel,
    basketballNetModel,
    routingElementsModel,
    videos,
    currentScene,
    outdoorCars
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
      <ArcadeBoard />
      <BlogDoor />
      <LockedDoor />

      {/* TODO: shut down physics after x seconds of not being in blog scene */}
      {/* TODO: basketball should use the same physics world */}
      <Suspense fallback={null}>
        <PhysicsWorld gravity={[0, -24, 0]} paused={scene !== "blog"}>
          <Lamp />
        </PhysicsWorld>
      </Suspense>
      <OutdoorCars />
      {Object.values(routingNodes).map((node) => {
        const matchingTab = currentScene?.tabs?.find(
          (tab) => tab.tabClickableName === node.name
        )

        const isLabGroup =
          node.name === "LaboratoryHome_HoverA" ||
          node.name === "LaboratoryHome_HoverB"
        const groupName = isLabGroup ? "laboratory-home" : undefined

        return (
          <RoutingElement
            key={node.name}
            node={node}
            route={matchingTab?.tabRoute ?? ""}
            hoverName={matchingTab?.tabHoverName ?? node.name}
            groupName={groupName}
          />
        )
      })}
      {useMesh.getState().hoopMeshes.hoop && (
        <primitive object={useMesh.getState().hoopMeshes.hoop as Mesh} />
      )}
      {net && net instanceof THREE.Mesh && <Net mesh={net} />}
      <BakesLoader />
      <ReflexesLoader />
    </group>
  )
})

Map.displayName = "Map"
