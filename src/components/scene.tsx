"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"
import { useKeyPress } from "@/hooks/use-key-press"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

import { CustomCamera } from "./camera/camera-controls"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { MouseTracker } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { Renderer } from "./postprocessing/renderer"
import dynamic from "next/dynamic"

export const Scene = () => {
  const pathname = usePathname()
  const router = useRouter()
  const isBasketball = pathname === "/basketball"
  const [documentElement, setDocumentElement] = useState<HTMLElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    setCurrentTabIndex,
    currentTabIndex,
    currentScene
  } = useNavigationStore()

  useEffect(() => {
    setDocumentElement(document.documentElement)
  }, [])

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
        pathname.startsWith("/services") ||
        pathname.startsWith("/blog") ||
        pathname.startsWith("/people")
      ) {
        router.push("/")
      }
    }, [pathname, router])
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
        eventSource={documentElement}
        eventPrefix="client"
        camera={{ fov: 60 }}
        className="outline-none focus-visible:outline-none"
      >
        <Renderer
          sceneChildren={
            <>
              <color attach="background" args={["#000"]} />
              <CustomCamera />
              <MapWire />
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
