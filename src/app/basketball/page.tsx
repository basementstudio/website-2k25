"use client";
import { useCameraStore } from "@/store/app-store";
import { useEffect } from "react";

const BasketballPage = () => {
  const { setCameraState } = useCameraStore();

  useEffect(() => {
    setCameraState("hoop");
  }, [setCameraState]);

  return (
    <div className="h-screen w-full bg-black">
      <h1 className="pt-16 text-center text-6xl font-bold text-white">
        BASKETBALL
      </h1>
    </div>
  );
};

export default BasketballPage;
