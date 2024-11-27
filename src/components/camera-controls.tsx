import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { CameraState, useCameraStore } from "@/store/app-store";

const ANIMATION_CONFIG = {
  duration: 2,
  progress: 0,
  easing: (x: number) => x * x * (3 - 2 * x),
};

const currentPos = new Vector3(9, 1.6, -8.5);
const currentTarget = new Vector3(7, 1.6, -12);

export const CustomCamera = () => {
  const { cameraConfig, previousCameraState } = useCameraStore();
  const cameraControlsRef = useRef<CameraControls>(null);
  const isFirstRender = useRef(true);

  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls && isFirstRender.current) {
      // Only set initial position if there was a previous state
      if (previousCameraState) {
        controls.setPosition(9, 1.6, -8.5);
        controls.setTarget(7, 1.6, -12);
      } else {
        // Set camera directly to current config position if no previous state
        const { position, target } = cameraConfig as CameraState;
        controls.setPosition(...position);
        controls.setTarget(...target);
      }
      controls.disconnect();
      isFirstRender.current = false;
    }
  }, [cameraConfig, previousCameraState]);

  const controls = cameraControlsRef.current;

  useEffect(() => {
    const { position, target } = cameraConfig as unknown as CameraState;
    targetPosition.set(...position);
    targetLookAt.set(...target);

    ANIMATION_CONFIG.progress = 0;
  }, [cameraConfig, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    if (!controls || isFirstRender.current) return;

    ANIMATION_CONFIG.progress = Math.min(
      ANIMATION_CONFIG.progress + delta / ANIMATION_CONFIG.duration,
      1,
    );
    const easeValue = ANIMATION_CONFIG.easing(ANIMATION_CONFIG.progress);

    controls.getPosition(currentPos);
    controls.getTarget(currentTarget);

    currentPos.lerp(targetPosition, easeValue);
    currentTarget.lerp(targetLookAt, easeValue);

    controls.setPosition(currentPos.x, currentPos.y, currentPos.z);
    controls.setTarget(currentTarget.x, currentTarget.y, currentTarget.z);

    if (ANIMATION_CONFIG.progress >= 1) {
      ANIMATION_CONFIG.progress = 0;
    }
  });

  return <CameraControls makeDefault ref={cameraControlsRef} />;
};
