"use client";
import { Canvas } from "@react-three/fiber";
import { CameraStateKeys } from "@/store/app-store";
import { CustomCamera } from "@/components/camera-controls";
import { Environment } from "@react-three/drei";
import { Map } from "./map";
import { usePathname, useRouter } from "next/navigation";

export const Scene = () => {
  const pathname = usePathname();
  const router = useRouter();

  const getInitialCameraState = (): CameraStateKeys => {
    switch (pathname) {
      case "/arcade":
        return "arcade";
      case "/about":
        return "stairs";
      case "/basketball":
        return "hoop";
      default:
        return "home";
    }
  };
  return (
    <div className="h-screen w-full">
      <Canvas>
        <color attach="background" args={["#000"]} />
        <CustomCamera initialState={getInitialCameraState()} />
        <Map />
        <Environment preset="sunset" />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => router.push("/")}
      >
        <p>HOME</p>
      </div>
      <div className="absolute right-6 top-6 cursor-pointer bg-white p-2">
        <p>MENU</p>
      </div>
    </div>
  );
};
