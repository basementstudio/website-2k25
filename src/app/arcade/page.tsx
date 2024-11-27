"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const ArcadePage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCameraState("arcade");
    }, 100);

    return () => clearTimeout(timer);
  }, [setCameraState]);

  return <div className="h-screen w-full bg-black"></div>;
};

export default ArcadePage;
