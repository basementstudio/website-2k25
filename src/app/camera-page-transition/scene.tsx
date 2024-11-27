"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CustomCamera } from "./camera-controls";
import { Map } from "./map";
import { useState } from "react";

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_STATES: Record<
  "position1" | "position2" | "position3" | "position4" | "position5",
  CameraState
> = {
  position1: {
    position: [9, 1.6, -8.5],
    target: [7, 1.6, -12],
  },
  position2: {
    position: [2.9, 1.63, -13.21],
    target: [2.9, 1.3, -14],
  },
  position3: {
    position: [6, 1.63, -10.21],
    target: [4, 1, -8],
  },
  position4: {
    position: [5.5, 1.6, -10],
    target: [5.5, 1.8, -12],
  },
  position5: {
    position: [16, 14, -5],
    target: [7, 1.6, -16],
  },
} as const;

export const Scene = () => {
  const [cameraState, setCameraState] =
    useState<keyof typeof CAMERA_STATES>("position1");

  return (
    <>
      <Canvas>
        <CustomCamera cameraPositions={CAMERA_STATES[cameraState]} />
        <Map />
        <Environment preset="sunset" />
      </Canvas>
      <div className="h-10gap-2 absolute left-6 top-6 flex gap-2 bg-red-500 p-2">
        {Object.keys(CAMERA_STATES).map((key) => (
          <button
            key={key}
            className="bg-white px-8 text-black"
            onClick={() => setCameraState(key as keyof typeof CAMERA_STATES)}
          >
            {key}
          </button>
        ))}
      </div>
    </>
  );
};
