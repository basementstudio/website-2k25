"use client"

import { Canvas } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { Suspense, useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { UpdateCanvasCursor } from "@/components/custom-cursor"
import { Inspectables } from "@/components/inspectables/inspectables"
import { Map } from "@/components/map/map"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Renderer } from "@/components/postprocessing/renderer"
import { Sparkles } from "@/components/sparkles"
import { useTabKeyHandler } from "@/hooks/use-key-press"
import { useMinigameStore } from "@/store/minigame-store"

import ErrorBoundary from "./basketball/error-boundary"
import { CameraController } from "./camera/camera-controller"
import { CharacterInstanceConfig } from "./characters/character-instancer"
import { CharactersSpawn } from "./characters/characters-spawn"
import { Debug } from "./debug"
import { Pets } from "./pets"
import { AnimationController } from "./shared/AnimationController"
import { WebGlTunnelOut } from "./tunnel"
import { cn } from "@/utils/cn"

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
  const { setIsCanvasTabMode, currentScene } = useNavigationStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isBasketball = currentScene?.name === "basketball"
  const clearPlayedBalls = useMinigameStore((state) => state.clearPlayedBalls)
  const userHasLeftWindow = useRef(false)
  const [isTouchOnly, setIsTouchOnly] = useState(false)

  useTabKeyHandler()

  useEffect(() => {
    const detectTouchOnly = () => {
      const hasTouchScreen =
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches

      setIsTouchOnly(hasTouchScreen && hasCoarsePointer && !hasFinePointer)
    }

    detectTouchOnly()

    // Re-detect on window resize as input capabilities might change
    window.addEventListener("resize", detectTouchOnly)

    return () => window.removeEventListener("resize", detectTouchOnly)
  }, [])

  useEffect(() => {
    if (!isBasketball) {
      clearPlayedBalls()
      useMinigameStore.getState().setHasPlayed(false)
      useMinigameStore.getState().setPlayerName("")
      useMinigameStore.getState().setReadyToPlay(true)
    }
  }, [isBasketball, clearPlayedBalls])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        userHasLeftWindow.current = true
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true
    })
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const handleFocus = (e: React.FocusEvent) => {
    if (userHasLeftWindow.current) {
      userHasLeftWindow.current = false
      return
    }

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
      <div
        className={cn(
          "absolute inset-0",
          isTouchOnly && "pointer-events-none cursor-not-allowed"
        )}
      >
        <Debug />
        <Canvas
          id="canvas"
          frameloop="never"
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
            <UpdateCanvasCursor />
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
    </>
  )
}
