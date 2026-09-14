"use client"

import { Canvas } from "@react-three/fiber"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { PCFShadowMap } from "three"

import { Debug } from "@/components/debug"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useTabKeyHandler } from "@/hooks/use-key-press"
import { createSiteEvents } from "@/lib/graphics/events"
import { useGraphicsLifecycle } from "@/lib/graphics/lifecycle"
import { createSiteRenderer } from "@/lib/graphics/renderer"
import { RendererLifetime } from "@/lib/graphics/renderer-lifetime"
import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

const SceneContent = lazy(() => import("./scene-content"))

export const Scene = () => {
  const loaderFrame = useAppLoadingStore((s) => s.hasLoaderFrame)
  const loaderFailed = useAppLoadingStore((s) => s.loaderFailed)
  const generation = useGraphicsLifecycle((s) => s.generation)
  const forceWebGL = useGraphicsLifecycle((s) => s.forceWebGL)
  // Per-field selectors: destructuring the whole store re-rendered the entire
  // <Canvas> subtree on every unrelated navigation-store write.
  const setIsCanvasTabMode = useNavigationStore(
    (state) => state.setIsCanvasTabMode
  )
  const isBasketball = useNavigationStore(
    (state) => state.currentScene?.name === "basketball"
  )
  const isFullHeightScene = useNavigationStore((state) => {
    const name = state.currentScene?.name
    return name === "basketball" || name === "lab" || name === "404"
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clearPlayedBalls = useMinigameStore((state) => state.clearPlayedBalls)
  const userHasLeftWindow = useRef(false)
  const [isTouchOnly, setIsTouchOnly] = useState(false)
  // DPR is capped at 1 below the desktop breakpoint: rendering the 80svh
  // mobile canvas at retina resolution roughly quadruples the per-frame GPU
  // and post-processing cost on the phones already struggling with INP.
  const [dpr, setDpr] = useState<number | [number, number]>(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : [1, 1.5]
  )
  useTabKeyHandler()

  useEffect(() => {
    const detectTouchOnly = () => {
      const hasTouchScreen =
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches

      setIsTouchOnly(hasTouchScreen && hasCoarsePointer && !hasFinePointer)
      setDpr(window.innerWidth < 1024 ? 1 : [1, 1.5])
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
          isFullHeightScene && "inset-x-0 top-0 h-[100svh]"
        )}
      >
        <Debug />
        <Canvas
          id="canvas"
          events={createSiteEvents}
          shadows={{ enabled: false, type: PCFShadowMap }}
          frameloop="demand"
          dpr={dpr}
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
          key={generation}
          gl={async (options) =>
            createSiteRenderer(
              { canvas: options.canvas as HTMLCanvasElement },
              () => useGraphicsLifecycle.getState().recover(generation),
              forceWebGL
            )
          }
          camera={{ fov: 60 }}
          className={cn(
            "pointer-events-auto cursor-auto outline-none focus-visible:outline-none [&_canvas]:touch-none",
            isTouchOnly && !isBasketball && "!pointer-events-none"
          )}
        >
          <RendererLifetime />
          {(loaderFrame || loaderFailed) && (
            <Suspense fallback={null}>
              <SceneContent />
            </Suspense>
          )}
        </Canvas>
      </div>
    </>
  )
}
