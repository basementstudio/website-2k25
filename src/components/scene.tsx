"use client"

import { Environment } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import * as THREE from "three"

import { Inspectables } from "@/components/inspectables/inspectables"
import { Map } from "@/components/map"

import { HoopMinigame } from "./basketball/hoop-minigame"
import { CustomCamera } from "./camera-controls"
import { Debug } from "./debug"
import { MapWire } from "./map-wire"
import { Renderer } from "./postprocessing/renderer"

export const Scene = () => (
  <div className="absolute inset-0">
    <Leva />
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping
      }}
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

            <Physics debug>
              <Map />
              <HoopMinigame />
            </Physics>
          </>
        }
      />
    </Canvas>
  </div>
)
