"use client"

import { Canvas } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { Perf } from "r3f-perf"
import { Suspense, useEffect, useRef } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Map } from "@/components/map/map"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Renderer } from "@/components/postprocessing/renderer"
import { Sparkles } from "@/components/sparkles"
import { useMinigameStore } from "@/store/minigame-store"

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
import { MouseTracker } from "@/hooks/use-mouse"

export const Scene = () => {
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    setCurrentTabIndex,
    currentScene
  } = useNavigationStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isBasketball = currentScene?.name === "basketball"
  const clearPlayedBalls = useMinigameStore((state) => state.clearPlayedBalls)

  useEffect(() => {
    if (!isBasketball) {
      clearPlayedBalls()
    }
  }, [isBasketball, clearPlayedBalls])

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
    <>
      <div className="absolute inset-0">
        <Debug />
        <Canvas
          id="canvas"
          ref={canvasRef}
          tabIndex={0}
          onFocus={handleFocus}
          onBlur={handleBlur}
          gl={{
            antialias: true,
            alpha: false,
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping
          }}
          camera={{ fov: 60 }}
          className="pointer-events-auto cursor-auto outline-none focus-visible:outline-none"
        >
          <Renderer
            sceneChildren={
              <>
                <color attach="background" args={["#000"]} />
                <CameraController />
                <Inspectables />
                <Sparkles />
                <Map />
                <Suspense fallback={null}>
                  {isBasketball && (
                    <PhysicsWorld paused={!isBasketball}>
                      <HoopMinigame />
                      <PlayedBasketballs />
                    </PhysicsWorld>
                  )}
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
      <MouseTracker />
    </>
  )
}
