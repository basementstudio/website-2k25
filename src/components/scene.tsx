"use client";

import { Canvas } from "@react-three/fiber";
import { Map } from "./map";
import { useRouter } from "next/navigation";
import { CameraStateKeys, useCameraStore } from "@/store/app-store";

export const Scene = () => {
  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const handleNavigation = (route: string, cameraState: CameraStateKeys) => {
    setCameraState(cameraState);
    router.push(route);
  };

  return (
    <div className={className}>
      <Canvas gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={["#000"]} />
        <Map handleNavigation={handleNavigation} />
        <Environment preset="sunset" />
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
        }}
      >
        <p>MENU</p>
      </div>
    </div>
  );
};
