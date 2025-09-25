"use client"

import dynamic from "next/dynamic"
import { memo, Suspense, useEffect, useRef, useState } from "react"
import { Mesh, MeshStandardMaterial, Object3D } from "three"
import * as THREE from "three"

import { ArcadeBoard } from "@/components/arcade-board"
import { ArcadeScreen } from "@/components/arcade-screen"
import { useAssets } from "@/components/assets-provider"
import { Net } from "@/components/basketball/net"
import { BlogDoor } from "@/components/blog-door"
import { Clock } from "@/components/clock"
import { Godrays } from "@/components/godrays"
import { Lamp } from "@/components/lamp"
import { LockedDoor } from "@/components/locked-door"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { OutdoorCars } from "@/components/outdoor-cars"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { RoutingElement } from "@/components/routing-element/routing-element"
import { SpeakerHover } from "@/components/speaker-hover"
import { Weather } from "@/components/weather"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { createVideoTextureWithResume } from "@/hooks/use-video-resume"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { createNotFoundMaterial } from "@/shaders/material-not-found"

import { BakesLoader } from "./bakes"
import { extractMeshes } from "./extract-meshes"
import { useFrameLoop } from "./use-frame-loop"
import { useLoader } from "./use-loader"

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

export const Map = memo(() => {
  const { inspectables, videos, matcaps, glassMaterials, doubleSideElements } =
    useAssets()

  const {
    office,
    officeItems,
    outdoor,
    godrays,
    outdoorCars,
    basketballNet,
    routingElements
  } = useLoader()

  useFrameLoop()

  const scene = useCurrentScene()
  const currentScene = useNavigationStore((state) => state.currentScene)

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({})

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {}
    routingElements?.traverse((child) => {
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
  }, [currentScene, routingElements])

  const alreadyTraversed = useRef(false)

  useEffect(() => {
    if (alreadyTraversed.current) return

    if (
      office &&
      officeItems &&
      routingElements &&
      outdoor &&
      outdoorCars &&
      godrays &&
      basketballNet
    ) {
      const traverse = (
        child: Object3D,
        overrides?: { FOG?: boolean; GODRAY?: boolean }
      ) => {
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

          const withVideo = videos.find(
            (video) => video.mesh === meshChild.name
          )
          const withMatcap = matcaps?.find((m) => m.mesh === meshChild.name)
          const isClouds = meshChild.name === "cloudy_01"
          const isGlass = glassMaterials.includes(currentMaterial.name)
          const isDaylight = meshChild.name === "DL_ScreenB"

          currentMaterial.side = doubleSideElements.includes(meshChild.name)
            ? THREE.DoubleSide
            : THREE.FrontSide

          if (withVideo) {
            const videoTexture = createVideoTextureWithResume(withVideo.url)

            // Clean up old video texture if it exists
            if (
              currentMaterial.map &&
              "video" in (currentMaterial.map as any)
            ) {
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
            currentMaterial.map.minFilter = THREE.NearestFilter
          }

          const CONFIG = {
            GLASS: isGlass,
            LIGHT: false,
            GODRAY: overrides?.GODRAY,
            FOG: overrides?.FOG,
            MATCAP: withMatcap !== undefined,
            VIDEO: withVideo !== undefined,
            CLOUDS: isClouds,
            DAYLIGHT: isDaylight
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

          meshChild.userData.hasGlobalMaterial = true
        }
      }

      office.traverse((child) => traverse(child))
      officeItems.traverse((child) => traverse(child))
      routingElements.traverse((child) => traverse(child, { FOG: false }))
      outdoor.traverse((child) => traverse(child, { FOG: false }))
      outdoorCars.traverse((child) => traverse(child, { FOG: false }))
      godrays.traverse((child) => traverse(child, { GODRAY: true }))

      extractMeshes({
        office,
        officeItems,
        godrays,
        outdoorCars,
        basketballNet,
        inspectables
      })

      alreadyTraversed.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    office,
    officeItems,
    routingElements,
    outdoor,
    outdoorCars,
    godrays,
    basketballNet
  ])

  return (
    <group>
      <primitive object={office} />
      <primitive object={officeItems} />
      <primitive object={outdoor} />

      {/*Godrays */}
      <Godrays />

      {/*Homepage */}
      <SpeakerHover />

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
      <Clock />

      {/* Basketball */}
      {useMesh.getState().basketball.hoop && (
        <primitive object={useMesh.getState().basketball.hoop as Mesh} />
      )}
      <Net />

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
    </group>
  )
})

Map.displayName = "Map"
