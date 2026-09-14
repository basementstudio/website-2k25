"use client"

import { memo, useEffect, useMemo, useRef } from "react"
import { Mesh } from "three"

import { ArcadeBoard } from "@/components/arcade-board"
import { ArcadeScreen } from "@/components/arcade-screen"
import { useAssets } from "@/components/assets-provider"
import { LedLeaderboard } from "@/components/basketball/led-leaderboard"
import { LedScoreboard } from "@/components/basketball/led-scoreboard"
import { Net } from "@/components/basketball/net"
import { BlogDoor } from "@/components/blog-door"
import { ChristmasTree } from "@/components/christmas-tree"
import { CitySkyline } from "@/components/city-skyline"
import { Clock } from "@/components/clock"
import { Godrays } from "@/components/godrays"
import { LockedDoor } from "@/components/locked-door"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { OutdoorCars } from "@/components/outdoor-cars"
import { RoutingElement } from "@/components/routing-element/routing-element"
import { Sky } from "@/components/sky"
import { SpeakerHover } from "@/components/speaker-hover"
import { Weather } from "@/components/weather"
import { useMesh } from "@/hooks/use-mesh"
import { markCanvasBootStage } from "@/lib/canvas-boot"

import { extractMeshes } from "./extract-meshes"
import { usePrepareMapMaterials } from "./prepare-materials"
import { useFrameLoop } from "./use-frame-loop"
import { useLoader } from "./use-loader"

const legacySkyNodes = ["TX_Sky001", "TX_Sky002", "cloudy_01", "cloudy_02"]

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

  const tabs = useNavigationStore((state) => state.currentScene?.tabs)

  const routingMeshes = useMemo(() => {
    const meshes: Record<string, Mesh> = {}
    routingElements?.traverse((child) => {
      if (child instanceof Mesh) {
        meshes[child.name] = child
      }
    })
    return meshes
  }, [routingElements])

  const traverse = usePrepareMapMaterials()
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
      alreadyTraversed.current = true

      // One material swap per mesh across seven scene graphs — run per-graph
      // with a yield in between so it lands as several short tasks instead of
      // one uninterruptible long task right after the GLTFs decode.
      const steps = [
        () => office.traverse((child) => traverse(child)),
        () =>
          routingElements.traverse((child) => traverse(child, { FOG: false })),
        () =>
          outdoor.traverse((child) =>
            traverse(child, { FOG: false, OUTDOOR: true })
          ),
        () =>
          outdoorCars.traverse((child) =>
            traverse(child, { FOG: false, OUTDOOR: true })
          ),
        () => godrays.traverse((child) => traverse(child, { GODRAY: true })),
        () => {
          extractMeshes({
            office,
            officeItems,
            godrays,
            outdoorCars,
            basketballNet,
            inspectables
          })

          markCanvasBootStage("map-ready")
          useMesh.setState({ mapMaterialsReady: true })
        }
      ]

      let canceled = false
      const runSteps = async () => {
        for (const step of steps) {
          if (canceled) return
          step()
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      runSteps()
      return () => {
        canceled = true
      }
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

      {/*Services */}
      <Sky />
      <CitySkyline />
      <Weather />
      <OutdoorCars />
      <ChristmasTree />
      <Clock />

      {/* Basketball */}
      {useMesh.getState().basketball.hoop && (
        <primitive object={useMesh.getState().basketball.hoop as Mesh} />
      )}
      <Net />
      <LedScoreboard />
      <LedLeaderboard />

      {/* Routing */}
      {tabs?.map((tab) => {
        const node = routingMeshes[tab.tabClickableName]
        if (!node) return null

        const isLabGroup =
          node.name === "LaboratoryHome_HoverA" ||
          node.name === "LaboratoryHome_HoverB"
        const groupName = isLabGroup ? "laboratory-home" : undefined

        return (
          <RoutingElement
            key={node.name}
            node={node}
            route={tab.tabRoute ?? ""}
            hoverName={tab.tabHoverName ?? node.name}
            groupName={groupName}
          />
        )
      })}
    </group>
  )
})

Map.displayName = "Map"
