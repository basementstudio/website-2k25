"use client";

import { Canvas } from "@react-three/fiber";
import { CustomCamera } from "@/components/camera-controls";
import { Environment } from "@react-three/drei";
import { Map } from "@/components/map";
import { useRouter } from "next/navigation";
import { CameraStateKeys, useCameraStore } from "@/store/app-store";
import { Inspectables } from "@/components/inspectables/inspectables";
import { InspectableModal } from "./inspectables/inspectable-modal";
import { useCallback } from "react";
import { MapWire } from "./map-wire";

interface SceneProps {
  className?: string;
}

export const Scene = ({ className }: SceneProps) => {
  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const handleNavigation = useCallback(
    (route: string, cameraState: CameraStateKeys) => {
      setCameraState(cameraState);
      router.push(route);
    },
    [router, setCameraState],
  );

  return (
    <div className={className}>
      <Canvas gl={{ antialias: true, alpha: false }} camera={{ fov: 45 }}>
        <color attach="background" args={["#000"]} />
        <CustomCamera />
        <Map />
        <MapWire />
        <Inspectables />
        <Environment preset="studio" />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => handleNavigation("/", "home")}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("menu")}
      >
        <p>MENU</p>
      </div>
      <InspectableModal />
    </div>
  );
};
