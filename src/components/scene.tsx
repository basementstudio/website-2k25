"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"

const HoopMinigame = dynamic(
  () => import("./basketball/hoop-minigame").then((mod) => mod.HoopMinigame),
  { ssr: false }
)

import { CustomCamera } from "./camera/camera-controls"
import { Debug } from "./debug"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { MouseTracker } from "./mouse-tracker/mouse-tracker"
import { Renderer } from "./postprocessing/renderer"

const ContactCanvas = dynamic(() => import("./contact/contact-canvas"), {
  ssr: false
})

export const Scene = () => {
  const pathname = usePathname()
  const isBasketball = pathname === "/basketball"
  const isContact = pathname === "/contact"
  const [documentElement, setDocumentElement] = useState<HTMLElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null!)

  useEffect(() => {
    setDocumentElement(document.documentElement)
  }, [])

  return (
    <>
      <div className="absolute inset-0">
        <div className="w-128 absolute bottom-8 right-64 z-50">
          <Leva collapsed fill />
        </div>
        <MouseTracker canvasRef={canvasRef} />
        <Canvas
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
        >
          <Renderer
            sceneChildren={
              <>
                <color attach="background" args={["#000"]} />
                <CustomCamera />
                <Debug />
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

      {/* {isContact && ( */}
      <div className="absolute inset-0">
        <ContactCanvas />
      </div>
      {/* )} */}
    </>
  )
}
