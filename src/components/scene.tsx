"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

import { Map } from "@/components/map";
import { Inspectables } from "@/components/inspectables/inspectables";
import { MapWire } from "./map-wire";
import { Debug } from "./debug";
import { CustomCamera } from "./camera-controls";

import { Renderer } from "./postprocessing/renderer";
import { Leva } from "leva";
import { HoopMinigame } from "./basketball/hoop-minigame";
import { Physics } from "@react-three/rapier";

export const Scene = () => (
  <div className="absolute inset-0">
    <Leva />
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
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
);
