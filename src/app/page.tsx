"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const Homepage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("home");
  }, [setCameraState]);

  return <div></div>;
};

export default Homepage;
