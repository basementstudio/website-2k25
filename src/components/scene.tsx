"use client";
import { Canvas } from "@react-three/fiber";
import { useCameraStore } from "@/store/app-store";
import { CustomCamera } from "@/components/camera-controls";
import { Environment } from "@react-three/drei";
import { Map } from "./map";

export const Scene = () => {
  const { setCameraState } = useCameraStore();

  return (
    <>
      <Canvas>
        <CustomCamera />
        <Map />
        <Environment preset="sunset" />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("home")}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("menu")}
      >
        <p>MENU</p>
      </div>
    </>
  );
};
