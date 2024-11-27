"use client";
import { useCameraStore } from "@/store/app-store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const CameraRouteHandler = () => {
  const pathname = usePathname();
  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname,
  );
  useEffect(() => {
    updateCameraFromPathname(pathname);
  }, [pathname, updateCameraFromPathname]);
  return null;
};
