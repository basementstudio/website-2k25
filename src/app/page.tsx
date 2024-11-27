"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const Homepage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("home");
  }, [setCameraState]);

  return <div className="h-screen w-full bg-black"></div>;
};

export default Homepage;
