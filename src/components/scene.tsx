"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Sparkles } from "@/components/sparkles"

import { HoopMinigame } from "./basketball/hoop-minigame"
import { CustomCamera } from "./camera/camera-controls"
import { Debug } from "./debug"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { Renderer } from "./postprocessing/renderer"

export const Scene = () => {
  const pathname = usePathname()
  const isBasketball = pathname === "/basketball"
  const [documentElement, setDocumentElement] = useState<HTMLElement>()

  useEffect(() => {
    setDocumentElement(document.documentElement)
  }, [])

  return (
    <div className="absolute inset-0">
      <div className="w-128 absolute bottom-8 right-64 z-50">
        <Leva collapsed fill />
      </div>
      <Canvas
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
                <HoopMinigame />
              </Physics>
            </>
          }
        />
      </Canvas>
    </div>
  )
}
