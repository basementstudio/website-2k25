"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const ArcadePage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("arcade");
  }, [setCameraState]);

  return (
    <div className="h-screen w-full bg-black">
      <h1 className="pt-16 text-center text-6xl font-bold text-white">
        ARCADE
      </h1>
    </div>
  );
};

export default ArcadePage;
