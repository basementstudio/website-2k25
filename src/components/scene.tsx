"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import { Map } from "@/components/map";
import { Inspectables } from "@/components/inspectables/inspectables";
import { MapWire } from "./map-wire";
import { Debug } from "./debug";
import { CustomCamera } from "./camera-controls";

import { Renderer } from "./postprocessing/renderer";
import { Leva } from "leva";

export const Scene = () => (
  <div className="absolute inset-0">
    <Leva />
    <Canvas gl={{ antialias: true, alpha: false }} camera={{ fov: 45 }}>
      <Renderer
        sceneChildren={
          <>
            <color attach="background" args={["#000"]} />
            <CustomCamera />
            <Debug />
            <Map />
            <MapWire />
            <Inspectables />
            <Environment preset="studio" />
          </>
        }
      />
    </Canvas>
  </div>
);
