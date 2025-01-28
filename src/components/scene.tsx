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

import { HoopMinigame } from "./basketball/hoop-minigame"
import { CustomCamera } from "./camera/camera-controls"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { MouseTracker } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { useTabNavigation } from "./navigation-handler/useTabNavigation"
import { Renderer } from "./postprocessing/renderer"
import { useKeyPress } from "@/hooks/use-key-press"

export const Scene = () => {
  const pathname = usePathname()
  const router = useRouter()
  const isBasketball = pathname === "/basketball"
  const [documentElement, setDocumentElement] = useState<HTMLElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const isCanvasTabMode = useNavigationStore((state) => state.isCanvasTabMode)
  const setIsCanvasTabMode = useNavigationStore(
    (state) => state.setIsCanvasTabMode
  )
  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )
  const lastEscapeTimeRef = useRef<number>(0)
  useEffect(() => {
    setDocumentElement(document.documentElement)
  }, [])

  useKeyPress(
    "Escape",
    useCallback(() => {
      if (pathname.startsWith("/services")) {
        router.push("/")
      }
    }, [pathname, router])
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.id !== "canvas") return

      if (e.key === "Enter" && !isCanvasTabMode) {
        e.preventDefault()
        setIsCanvasTabMode(true)
        setCurrentTabIndex(-1)
        console.log("Entered canvas tab mode")
      } else if (e.key === "Escape" && isCanvasTabMode) {
        e.preventDefault()
        const currentTime = Date.now()
        if (currentTime - lastEscapeTimeRef.current < 1200) {
          setIsCanvasTabMode(false)
          setCurrentTabIndex(-1)
          console.log("Exited canvas tab mode")
        }
        lastEscapeTimeRef.current = currentTime
      } else if (isCanvasTabMode && e.key === "Tab") {
        e.preventDefault()
        console.log("Tab trapped in canvas mode")
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCanvasTabMode, setIsCanvasTabMode, setCurrentTabIndex])

  useTabNavigation()

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
        gl={{
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping
        }}
        eventSource={documentElement}
        eventPrefix="client"
        camera={{ fov: 60 }}
        className={`after:absolute after:inset-0 after:z-50 after:border-[1px] after:border-brand-o after:opacity-0 after:content-[''] ${
          isCanvasTabMode ? "after:opacity-0" : "focus:after:opacity-100"
        }`}
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
                <HoopMinigame />
              </Physics>
            </>
          }
        />
      </Canvas>
    </div>
  )
}
