"use client";
import { Canvas } from "@react-three/fiber";
import { CustomCamera } from "@/components/camera-controls";
import { Environment } from "@react-three/drei";
import { Map } from "./map";
import { useRouter, usePathname } from "next/navigation";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

export const Scene = () => {
  const router = useRouter();
  const pathname = usePathname();
  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname,
  );
  const setCameraState = useCameraStore((state) => state.setCameraState);

  useEffect(() => {
    updateCameraFromPathname(pathname);
  }, [pathname, updateCameraFromPathname]);

  return (
    <div className="h-screen w-full">
      <Canvas>
        <color attach="background" args={["#000"]} />
        <CustomCamera initialState="home" />
        <Map />
        <Environment preset="sunset" />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => router.push("/")}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("menu")}
      >
        <p>MENU</p>
      </div>
    </div>
  );
};
