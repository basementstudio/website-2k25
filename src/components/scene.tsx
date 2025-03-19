"use client"

import { Preload } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { Suspense, useEffect, useRef } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Map } from "@/components/map/map"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Renderer } from "@/components/postprocessing/renderer"
import { Sparkles } from "@/components/sparkles"
import { MouseTracker } from "@/hooks/use-mouse"
import { useMinigameStore } from "@/store/minigame-store"

import ErrorBoundary from "./basketball/error-boundary"
import { CameraController } from "./camera/camera-controller"
import { CharacterInstanceConfig } from "./characters/character-instancer"
import { CharactersSpawn } from "./characters/characters-spawn"
import { Debug } from "./debug"
import { Pets } from "./pets"
import { AnimationController } from "./shared/AnimationController"
import { WebGlTunnelOut } from "./tunnel"

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
    if (!isBasketball) clearPlayedBalls()
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
          frameloop="demand"
          ref={canvasRef}
          tabIndex={0}
          onFocus={handleFocus}
          onBlur={handleBlur}
          gl={{
            antialias: false,
            alpha: false,
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.NoToneMapping
          }}
          camera={{ fov: 60 }}
          className="pointer-events-auto cursor-auto outline-none focus-visible:outline-none [&_canvas]:touch-none"
        >
          <AnimationController>
            <Renderer
              sceneChildren={
                <>
                  <Suspense fallback={null}>
                    <Inspectables />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Map />
                  </Suspense>
                  <Suspense fallback={null}>
                    <WebGlTunnelOut />
                  </Suspense>
                  <Suspense fallback={null}>
                    <CameraController />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Sparkles />
                  </Suspense>
                  {isBasketball && (
                    <PhysicsWorld paused={!isBasketball}>
                      <ErrorBoundary>
                        <HoopMinigame />
                      </ErrorBoundary>
                    </PhysicsWorld>
                  )}
                  <Suspense fallback={null}>
                    <CharacterInstanceConfig />
                    <CharactersSpawn />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Pets />
                  </Suspense>
                </>
              }
            />
          </AnimationController>
        </Canvas>
      </div>
      <MouseTracker />
    </>
  )
}
