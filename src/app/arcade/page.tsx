"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const ArcadePage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("arcade");
  }, [setCameraState]);

  return <div className="h-screen w-full bg-black"></div>;
};

export default ArcadePage;
