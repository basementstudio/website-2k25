"use client"

import dynamic from "next/dynamic"
import { memo, Suspense, useEffect, useRef, useState } from "react"
import { Mesh, MeshStandardMaterial, Object3D, Object3DEventMap } from "three"
import * as THREE from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { ArcadeBoard } from "@/components/arcade-board"
import { ArcadeScreen } from "@/components/arcade-screen"
import { useAssets } from "@/components/assets-provider"
import { Net } from "@/components/basketball/net"
import { BlogDoor } from "@/components/blog-door"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { Lamp } from "@/components/lamp"
import { LockedDoor } from "@/components/locked-door"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { SpeakerHover } from "@/components/other/speaker-hover"
import { OutdoorCars } from "@/components/outdoor-cars"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { RoutingElement } from "@/components/routing-element/routing-element"
import { Weather } from "@/components/weather"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import notFoundFrag from "@/shaders/not-found/not-found.frag"

import { BakesLoader } from "./bakes"
import { useGodrays } from "./use-godrays"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"

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
  videoElement.playsInline = true
  videoElement.crossOrigin = "anonymous"
  videoElement.play()

  return new THREE.VideoTexture(videoElement)
}

type SceneType = Object3D<Object3DEventMap> | null

export const Map = memo(() => {
  const {
    officeItems,
    office,
    outdoor: outdoorPath,
    godrays: godraysPath,
    basketballNet: basketballNetPath,
    routingElements: routingElementsPath,
    inspectables: inspectableAssets,
    videos,
    outdoorCars,
    matcaps,
    glassMaterials,
    doubleSideElements
  } = useAssets()
  const scene = useCurrentScene()
  const currentScene = useNavigationStore((state) => state.currentScene)

  const { scene: officeModel } = useKTX2GLTF(office) as unknown as GLTFResult
  const { scene: officeItemsModel } = useKTX2GLTF(
    officeItems
  ) as unknown as GLTFResult
  const { scene: outdoorModel } = useKTX2GLTF(
    outdoorPath
  ) as unknown as GLTFResult
  const { scene: godrayModel } = useKTX2GLTF(
    godraysPath
  ) as unknown as GLTFResult
  const { scene: outdoorCarsModel } = useKTX2GLTF(
    outdoorCars.model
  ) as unknown as GLTFResult
  const { scene: basketballNetModel } = useKTX2GLTF(basketballNetPath)
  const { scene: routingElementsModel } = useKTX2GLTF(
    routingElementsPath
  ) as unknown as GLTFResult

  const [officeScene, setOfficeScene] = useState<SceneType>(null)
  const [outdoorScene, setOutdoorScene] = useState<SceneType>(null)
  const [godrayScene, setGodrayScene] = useState<SceneType>(null)

  const [godrays, setGodrays] = useState<Mesh[]>([])
  useGodrays({ godrays })

  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})
  const [net, setNet] = useState<Mesh | null>(null)

  const animationProgress = useRef(0)
  const isAnimating = useRef(false)
  const timeRef = useRef(0)

  const { fadeFactor, inspectingEnabled } = useFadeAnimation()

  useFrameCallback((_, delta) => {
    Object.values(shaderMaterialsRef).forEach((material) => {
      material.uniforms.uTime.value += delta

      material.uniforms.inspectingEnabled.value = inspectingEnabled.current
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
    })

    if (useMesh.getState().cctv?.screen?.material) {
      // @ts-ignore
      useMesh.getState().cctv.screen.material.uniforms.uTime.value += delta
    }
  })

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

    const netMesh = officeModel?.getObjectByName("SM_Red")

    if (netMesh?.parent) {
      netMesh.removeFromParent()

      setNet(basketballNetModel.children[0] as Mesh)
    }

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
          side: THREE.FrontSide,
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

      if ("isMesh" in child) {
        const meshChild = child as Mesh

        const alreadyReplaced = meshChild.userData.hasGlobalMaterial
        if (alreadyReplaced) return

        const currentMaterial = meshChild.material as MeshStandardMaterial

        const withVideo = videos.find((video) => video.mesh === meshChild.name)
        const withMatcap = matcaps?.find((m) => m.mesh === meshChild.name)
        const isClouds = meshChild.name === "cloudy_01"
        const isGlass = glassMaterials.includes(currentMaterial.name)
        const isDaylight = meshChild.name === "DL_ScreenB"

        currentMaterial.side = doubleSideElements.includes(meshChild.name)
          ? THREE.DoubleSide
          : THREE.FrontSide

        if (withVideo) {
          const videoTexture = createVideoTexture(withVideo.url)
          currentMaterial.map = videoTexture
          currentMaterial.map.flipY = false
          currentMaterial.emissiveMap = videoTexture
          currentMaterial.emissiveIntensity = withVideo.intensity
        }

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
                  GLASS: isGlass,
                  LIGHT: false,
                  GODRAY: overrides?.GODRAY,
                  FOG: overrides?.FOG,
                  MATCAP: withMatcap !== undefined,
                  VIDEO: withVideo !== undefined,
                  CLOUDS: isClouds,
                  DAYLIGHT: isDaylight
                }
              )
            )
          : createGlobalShaderMaterial(
              currentMaterial as MeshStandardMaterial,
              false,
              {
                GLASS: isGlass,
                LIGHT: false,
                GODRAY: overrides?.GODRAY,
                FOG: overrides?.FOG,
                MATCAP: withMatcap !== undefined,
                VIDEO: withVideo !== undefined,
                CLOUDS: isClouds,
                DAYLIGHT: isDaylight
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
    officeItemsModel.traverse((child) => traverse(child))
    routingElementsModel.traverse((child) => traverse(child, { FOG: false }))
    outdoorModel.traverse((child) => traverse(child, { FOG: false }))
    godrayModel.traverse((child) => traverse(child, { GODRAY: true }))

    const godrays: Mesh[] = []
    godrayModel.traverse((child) => {
      if (child instanceof Mesh) godrays.push(child)
    })

    setGodrays(godrays)
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

    const loboMarino = officeItemsModel.getObjectByName("SM_Lobo")
    const rain = officeModel.getObjectByName("SM_Rain")

    useMesh.setState({
      weather: {
        loboMarino: loboMarino as Mesh,
        rain: rain as Mesh
      }
    })

    const inspectables = useMesh.getState().inspectableMeshes

    if (inspectables.length === 0) {
      const inspectableMeshes: Mesh[] = []

      inspectableAssets.forEach(({ mesh: meshName }) => {
        const mesh = officeItemsModel.getObjectByName(meshName) as Mesh | null
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
    disableRaycasting(officeItemsModel)
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
      <primitive object={officeItemsModel} />
      <primitive object={outdoorScene} />
      <primitive object={godrayScene} />

      {/*Arcade */}
      <ArcadeScreen />
      <ArcadeBoard />

      {/*Blog */}
      <BlogDoor />
      <LockedDoor />
      <Suspense fallback={null}>
        <PhysicsWorld gravity={[0, -24, 0]} paused={scene !== "blog"}>
          {/* TODO: shut down physics after x seconds of not being in blog scene */}
          {/* TODO: basketball should use the same physics world */}
          <Lamp />
        </PhysicsWorld>
      </Suspense>

      {/*Services */}
      <Weather />
      <OutdoorCars />

      {/* Basketball */}
      {useMesh.getState().hoopMeshes.hoop && (
        <primitive object={useMesh.getState().hoopMeshes.hoop as Mesh} />
      )}
      {net && net instanceof THREE.Mesh && <Net mesh={net} />}

      {/*Homepage */}
      {scene === "home" && <SpeakerHover />}

      {/* Routing */}
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

      <BakesLoader />
    </group>
  )
})

Map.displayName = "Map"
