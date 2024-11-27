"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const ArcadePage = () => {
  const setCameraState = useCameraStore((state) => state.setCameraState);

  useEffect(() => {
    setCameraState("arcade");
  }, [setCameraState]);

  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute -top-[100px] left-0 h-[100px] w-full bg-black">
        <h1 className="pt-3 text-center text-6xl font-bold text-white">
          ARCADE
        </h1>
      </div>
    </div>
  );
};

export default ArcadePage;
