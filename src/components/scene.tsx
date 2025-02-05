"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { Map } from "./map/map"
import { MouseTracker } from "./mouse-tracker/mouse-tracker"
import { useNavigationStore } from "./navigation-handler/navigation-store"
import { Renderer } from "./postprocessing/renderer"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

import { CameraController } from "./camera/camera-controller"

export const Scene = () => {
  const scene = useCurrentScene()
  const isBasketball = scene === "basketball"
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const { isCanvasTabMode, setIsCanvasTabMode } = useNavigationStore()

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
