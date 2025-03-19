"use client"

import { Preload } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import dynamic from "next/dynamic"
import { Inspectables } from "@/components/inspectables/inspectables"
import { Map } from "@/components/map/map"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Renderer } from "@/components/postprocessing/renderer"
import { Sparkles } from "@/components/sparkles"
import { MouseTracker } from "@/hooks/use-mouse"
import { useMinigameStore } from "@/store/minigame-store"
import { useTabKeyHandler } from "@/hooks/use-key-press"

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
  const { setIsCanvasTabMode, currentScene, setCurrentTabIndex } =
    useNavigationStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isBasketball = currentScene?.name === "basketball"
  const clearPlayedBalls = useMinigameStore((state) => state.clearPlayedBalls)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Use our tab key handler to set currentTabIndex on first tab
  useTabKeyHandler()

  useEffect(() => {
    if (!isBasketball) clearPlayedBalls()
  }, [isBasketball, clearPlayedBalls])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handleFocus = (e: React.FocusEvent) => {
    setIsCanvasTabMode(true)

    if (e.nativeEvent.detail === 0) {
      const { setEnteredByKeyboard } = useNavigationStore.getState()
      setEnteredByKeyboard(true)

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
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
          onKeyDown={(e) => {
            if (
              e.key === "Tab" &&
              useNavigationStore.getState().isCanvasTabMode
            ) {
              e.preventDefault()
            }
          }}
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
                  <Suspense fallback={null}>
                    {isBasketball && (
                      <PhysicsWorld paused={!isBasketball}>
                        <ErrorBoundary>
                          <HoopMinigame />
                        </ErrorBoundary>
                      </PhysicsWorld>
                    )}
                  </Suspense>
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
