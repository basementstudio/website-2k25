"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"

import { HoopMinigame } from "./basketball/hoop-minigame"
import { CustomCamera } from "./camera/camera-controls"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { MouseTracker } from "./mouse-tracker/mouse-tracker"
import { Renderer } from "./postprocessing/renderer"

export const Scene = () => {
  const pathname = usePathname()
  const isBasketball = pathname === "/basketball"
  const [documentElement, setDocumentElement] = useState<HTMLElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [isCanvasTabMode, setIsCanvasTabMode] = useState(false)

  useEffect(() => {
    setDocumentElement(document.documentElement)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.id === "canvas") {
        if (e.key === "Enter" && !isCanvasTabMode) {
          e.preventDefault()
          setIsCanvasTabMode(true)
          console.log("Entered canvas tab mode!")
        } else if (e.key === "Escape" && isCanvasTabMode) {
          e.preventDefault()
          setIsCanvasTabMode(false)
          console.log("Exited canvas tab mode!")
        }
      }

      if (isCanvasTabMode && e.key === "Tab") {
        e.preventDefault()
        console.log("Tab trapped in canvas mode")
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCanvasTabMode])

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
        className={`after:absolute after:inset-0 after:z-50 after:bg-brand-o/10 after:opacity-0 after:content-[''] ${
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
