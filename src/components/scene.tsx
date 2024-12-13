"use client";

import { Canvas } from "@react-three/fiber";
import { CustomCamera } from "@/components/camera-controls";
import { Environment } from "@react-three/drei";

import { Map } from "@/components/map";
import { Inspectables } from "@/components/inspectables/inspectables";
import { MapWire } from "./map-wire";

export const Scene = () => (
  <div className="absolute inset-0">
    <Canvas gl={{ antialias: true, alpha: false, localClippingEnabled: true }} camera={{ fov: 45 }}>
      <color attach="background" args={["#000"]} />
      <CustomCamera />
      <Map />
      <MapWire />
      <Inspectables />
      <Environment preset="studio" />
    </Canvas>
  </div>
);
