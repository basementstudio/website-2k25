"use client"

import { Environment } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { Perf } from "r3f-perf"
import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { Map } from "./map/map"
import { MouseTracker, useMouseStore } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { Renderer } from "./postprocessing/renderer"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

import { CameraController } from "./camera/camera-controller"
import { Mesh } from "three"
import { usePathname } from "next/navigation"

export const Scene = () => {
  const scene = useCurrentScene()
  const isBasketball = scene === "basketball"
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const { isCanvasTabMode, setIsCanvasTabMode } = useNavigationStore()
  const cursorType = useMouseStore((state) => state.cursorType)

  const cursorTypeMap = {
    default: "default",
    hover: "pointer",
    click: "pointer",
    grab: "grab",
    grabbing: "grabbing",
    inspect: "help",
    zoom: "zoom-in"
  } as const

  useEffect(() => {
    setIsCanvasTabMode(isCanvasTabMode)
  }, [isCanvasTabMode, setIsCanvasTabMode])

  useEffect(() => {
    canvasRef.current.style.cursor = cursorTypeMap[cursorType]
  }, [cursorType])

  const handleFocus = () => {
    setIsCanvasTabMode(true)
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }
  const handleBlur = () => setIsCanvasTabMode(false)

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
        gl={{
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping
        }}
        camera={{ fov: 60 }}
        className={`outline-none focus-visible:outline-none`}
        ref={canvasRef}
      >
        <Perf style={{ position: "absolute", top: "50px", right: "24px" }} />
        <Renderer
          sceneChildren={
            <>
              <color attach="background" args={["#000"]} />
              <CameraController />
              <Inspectables />
              <StairControl />
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

const StairControl = () => {
  const pathname = usePathname()
  const scene = useThree((state) => state.scene)
  const stair = scene.getObjectByName("SM_Stair3") as Mesh

  useEffect(() => {
    if (!stair) return
    if (pathname === "/") {
      stair.visible = false
    } else {
      stair.visible = true
    }
  }, [stair, pathname])

  return <></>
}
