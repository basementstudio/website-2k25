"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const BasketballPage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("hoop");
  }, [setCameraState]);

  return <div className="h-screen w-full bg-black"></div>;
};

export default BasketballPage;
