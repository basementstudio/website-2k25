"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const AboutPage = () => {
  const setCameraState = useCameraStore((state) => state.setCameraState);

  useEffect(() => {
    setCameraState("stairs");
  }, [setCameraState]);

  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute -top-[100px] left-0 h-[100px] w-full bg-black">
        <h1 className="pt-3 text-center text-6xl font-bold text-white">
          ABOUT
        </h1>
      </div>
    </div>
  );
};

export default AboutPage;
