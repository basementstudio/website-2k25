"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const BasketballPage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCameraState("hoop");
    }, 100);

    return () => clearTimeout(timer);
  }, [setCameraState]);

  return <div className="h-screen w-full bg-black"></div>;
};

export default BasketballPage;
