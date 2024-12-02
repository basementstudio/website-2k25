"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { InstanceMap } from "./instance-map";
import { Perf } from "r3f-perf";
import { MapBlueprint } from "@/components/map-blueprint";

const CustomMaterialPage = () => {
  return (
    <div className="relative h-screen w-full bg-black">
      <Canvas>
        <Environment preset="sunset" />
        <gridHelper />
        <OrbitControls />
        <InstanceMap />
        <MapBlueprint />
        <Perf />
      </Canvas>
    </div>
  );
};

export default CustomMaterialPage;
