import { RootState, useFrame } from "@react-three/fiber";
import { createContext, useContext, useRef } from "react";
import { Camera } from "three";

export const renderTextureContext = createContext<{
  isInsideRenderTexture: boolean;
  isPlaying: boolean;
  camera?: Camera;
}>({
  isInsideRenderTexture: false,
  isPlaying: true,
  camera: undefined,
});

export const useRenderTexture = () => {
  return useContext(renderTextureContext);
};

export type TextureRenderCallback = (params: {
  elapsedTime: number;
  state: RootState;
  delta: number;
  frame?: XRFrame;
}) => void;

export const useTextureFrame = (
  callback: TextureRenderCallback,
  priority?: number
) => {
  const { isPlaying } = useRenderTexture();

  const elapsedTimeRef = useRef(0);
  useFrame((state, delta, frame) => {
    if (!isPlaying) return;
    elapsedTimeRef.current += delta;
    callback({
      elapsedTime: elapsedTimeRef.current,
      state,
      delta,
      frame,
    });
  }, priority);
};
