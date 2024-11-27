import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { CameraState } from "./scene";

export const CustomCamera = ({
  cameraPositions,
}: {
  cameraPositions: CameraState;
}) => {
  const cameraControlsRef = useRef<CameraControls>(null);
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());

  const ANIMATION_CONFIG = {
    duration: 2,
    progress: 0,
    easing: (x: number) => x * x * (3 - 2 * x),
  };

  useEffect(() => {
    const { position, target } = cameraPositions;
    targetPosition.current.set(...position);
    targetLookAt.current.set(...target);
  }, [cameraPositions]);

  useFrame((_, delta) => {
    if (cameraControlsRef.current) {
      ANIMATION_CONFIG.progress = Math.min(
        ANIMATION_CONFIG.progress + delta / ANIMATION_CONFIG.duration,
        1,
      );
      const easeValue = ANIMATION_CONFIG.easing(ANIMATION_CONFIG.progress);

      const currentPos = new Vector3();
      const currentTarget = new Vector3();
      cameraControlsRef.current.getPosition(currentPos);
      cameraControlsRef.current.getTarget(currentTarget);

      currentPos.lerp(targetPosition.current, easeValue);
      currentTarget.lerp(targetLookAt.current, easeValue);

      cameraControlsRef.current.setPosition(
        currentPos.x,
        currentPos.y,
        currentPos.z,
      );
      cameraControlsRef.current.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
      );

      if (ANIMATION_CONFIG.progress >= 1) {
        ANIMATION_CONFIG.progress = 0;
      }
    }
  });

  return <CameraControls ref={cameraControlsRef} />;
};
