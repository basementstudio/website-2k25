"use client";
import { Canvas } from "@react-three/fiber";
import { CustomCamera } from "@/components/camera-controls";
import { Map } from "./map";
import { useRouter } from "next/navigation";
import { CameraStateKeys, useCameraStore } from "@/store/app-store";
import { MapWire } from "./map-wire";

import { useState } from "react";

export const Scene = () => {
  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNavigation = (route: string, cameraState: CameraStateKeys) => {
    setCameraState(cameraState);
    router.push(route);
  };

  return (
    <div className="h-screen w-full">
      <Canvas>
        <color attach="background" args={["#000"]} />
        <CustomCamera />
        <Map handleNavigation={handleNavigation} isAnimating={isAnimating} />
        <MapWire />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => handleNavigation("/", "home")}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => {
          setCameraState("menu");
          setIsAnimating(true);
        }}
      >
        <p>MENU</p>
      </div>
    </div>
  );
};
