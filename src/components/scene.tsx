"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { Perf } from "r3f-perf"
import { Suspense, useEffect, useRef } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"
import { useMinigameStore } from "@/store/minigame-store"

import { Map } from "./map/map"
import { MouseTracker, useMouseStore } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { Renderer } from "./postprocessing/renderer"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

const PhysicsWorld = dynamic(
  () =>
    import("@react-three/rapier").then((mod) => {
      const { Physics } = mod
      return function PhysicsWrapper({
        children,
        paused
      }: {
        children: React.ReactNode
        paused: boolean
      }) {
        return <Physics paused={paused}>{children}</Physics>
      }
    }),
  { ssr: false }
)

import { PlayedBasketballs } from "./basketball/played-basketballs"
import StaticBasketballs from "./basketball/static-basketballs"
import { CameraController } from "./camera/camera-controller"
import { CharacterInstanceConfig } from "./characters/character-instancer"
import { CharactersSpawn } from "./characters/characters-spawn"
import { Debug } from "./debug"

const cursorTypeMap = {
  default: "default",
  hover: "pointer",
  click: "pointer",
  grab: "grab",
  grabbing: "grabbing",
  inspect: "help",
  zoom: "zoom-in"
} as const

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const cursorType = useMouseStore((state) => state.cursorType)
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    setCurrentTabIndex,
    currentScene
  } = useNavigationStore()
  const isBasketball = currentScene?.name === "basketball"
  const clearPlayedBalls = useMinigameStore((state) => state.clearPlayedBalls)

  useEffect(() => {
    if (!isBasketball) {
      clearPlayedBalls()
    }
  }, [isBasketball, clearPlayedBalls])

  useEffect(() => {
    canvasRef.current.style.cursor = cursorTypeMap[cursorType]
  }, [cursorType])

  useEffect(() => {
    setIsCanvasTabMode(isCanvasTabMode)
  }, [isCanvasTabMode, setIsCanvasTabMode])

  const handleFocus = (e: React.FocusEvent) => {
    setIsCanvasTabMode(true)
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })

    if (e.relatedTarget?.id === "nav-contact") {
      setCurrentTabIndex(0)
    } else {
      setCurrentTabIndex(currentScene?.tabs?.length ?? 0)
    }
  }
  const handleBlur = () => setIsCanvasTabMode(false)

  return (
    <div className="absolute inset-0">
      <MouseTracker canvasRef={canvasRef} />
      <Debug />
      <Canvas
        id="canvas"
        tabIndex={0}
        ref={canvasRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        gl={{
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping
        }}
        camera={{ fov: 60 }}
        className="outline-none focus-visible:outline-none"
      >
        <Renderer
          sceneChildren={
            <>
              <color attach="background" args={["#000"]} />
              <Inspectables />
              <Environment preset="studio" />
              <CameraController />
              <Sparkles />

              <Map />

              <Suspense fallback={null}>
                {isBasketball ? (
                  <PhysicsWorld paused={!isBasketball}>
                    <HoopMinigame />
                    <PlayedBasketballs />
                  </PhysicsWorld>
                ) : null}
              </Suspense>

              <StaticBasketballs />

              <CharacterInstanceConfig />
              <CharactersSpawn />
            </>
          }
        />
        <Perf
          style={{
            position: "absolute",
            top: 40,
            right: 10,
            zIndex: 1000
          }}
        />
      </Canvas>
    </div>
  )
}
