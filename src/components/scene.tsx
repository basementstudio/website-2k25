"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { usePathname } from "next/navigation"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"

import { HoopMinigame } from "./basketball/hoop-minigame"
import { CustomCamera } from "./camera-controls"
import { Debug } from "./debug"
import { Map } from "./map/map"
import { MapWire } from "./map/map-wire"
import { Renderer } from "./postprocessing/renderer"

export const Scene = () => {
  const pathname = usePathname()
  const isBasketball = pathname === "/basketball"

  return (
    <div className="absolute inset-0">
      <Leva />
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping
        }}
        eventSource={document.documentElement}
        eventPrefix="client"
        camera={{ fov: 45 }}
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
