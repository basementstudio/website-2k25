"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"

import { Map } from "./map/map"
import { MouseTracker, useMouseStore } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { Renderer } from "./postprocessing/renderer"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

import { CameraController } from "./camera/camera-controller"

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
  const pathname = usePathname()
  const scene = useCurrentScene()
  const { handleNavigation } = useHandleNavigation()
  const isBasketball = scene === "basketball"
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const cursorType = useMouseStore((state) => state.cursorType)
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    setCurrentTabIndex,
    currentTabIndex,
    currentScene
  } = useNavigationStore()

  useEffect(() => {
    canvasRef.current.style.cursor = cursorTypeMap[cursorType]
  }, [cursorType])

  useEffect(() => {
    setIsCanvasTabMode(isCanvasTabMode)
  }, [isCanvasTabMode, setIsCanvasTabMode])

  const handleFocus = () => {
    setIsCanvasTabMode(true)
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }
  const handleBlur = () => setIsCanvasTabMode(false)

  useKeyPress(
    "Escape",
    useCallback(() => {
      if (
        scene === "services" ||
        scene === "blog" ||
        scene === "people" ||
        scene === "basketball" ||
        scene === "lab" ||
        scene === "showcase"
      ) {
        handleNavigation("/")
      }
    }, [scene, handleNavigation])
  )

  useEffect(() => {
    if (pathname !== "/") {
      setCurrentTabIndex(0)
      return
    }

    if (currentTabIndex === -1) {
      setCurrentTabIndex(0)
    }
  }, [pathname])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
        if (!currentScene?.tabs || currentScene.tabs.length === 0) {
          setIsCanvasTabMode(false)
          return
        }

        if (isCanvasTabMode) {
          e.preventDefault()
          const currentIndex = currentTabIndex

          if (e.shiftKey) {
            const newIndex = currentIndex - 1
            setCurrentTabIndex(newIndex)

            if (currentIndex === 0) {
              setCurrentTabIndex(-1)
              setIsCanvasTabMode(false)
            }
          } else {
            const newIndex = currentIndex + 1
            setCurrentTabIndex(newIndex)

            if (
              currentScene.tabs &&
              currentIndex === currentScene.tabs.length - 1
            ) {
              setIsCanvasTabMode(false)
            }
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode
    ]
  )

  return (
    <div className="absolute inset-0">
      <MouseTracker canvasRef={canvasRef} />
      <div className="w-128 absolute bottom-8 right-64 z-50">
        <Leva collapsed fill hidden />
      </div>

      <Canvas
        id="canvas"
        tabIndex={0}
        ref={canvasRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
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
              <CameraController />
              <Inspectables />
              <Environment preset="studio" />
              <Sparkles />
              <Physics paused={!isBasketball}>
                <Map />
                {isBasketball && <HoopMinigame />}
              </Physics>
            </>
          }
        />
      </Canvas>
    </div>
  )
}
