import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import {
  CameraState,
  CameraStateKeys,
  useCameraStore,
} from "@/store/app-store";
import { CAMERA_STATES } from "@/constants/camera-states";

const animationConfig = {
  duration: 2,
  progress: 0,
  easing: (x: number) => x * x * (3 - 2 * x),
};

export const CustomCamera = ({
  initialState = "home",
}: {
  initialState?: CameraStateKeys;
}) => {
  const { cameraConfig } = useCameraStore();
  const cameraControlsRef = useRef<CameraControls>(null);

  const currentPos = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls) {
      const initialConfig = CAMERA_STATES[initialState];
      currentPos.set(...initialConfig.position);
      currentTarget.set(...initialConfig.target);

      controls.setPosition(...initialConfig.position);
      controls.setTarget(...initialConfig.target);
      controls.disconnect();
    }
  }, [initialState, currentPos, currentTarget]);

  const controls = cameraControlsRef.current;

  useEffect(() => {
    const { position, target } = cameraConfig as unknown as CameraState;
    targetPosition.set(...position);
    targetLookAt.set(...target);

    animationConfig.progress = 0;
  }, [cameraConfig, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    if (!controls) return;

    animationConfig.progress = Math.min(
      animationConfig.progress + delta / animationConfig.duration,
      1,
    );
    const easeValue = animationConfig.easing(animationConfig.progress);

    controls.getPosition(currentPos);
    controls.getTarget(currentTarget);

    currentPos.lerp(targetPosition, easeValue);
    currentTarget.lerp(targetLookAt, easeValue);

    controls.setPosition(currentPos.x, currentPos.y, currentPos.z);
    controls.setTarget(currentTarget.x, currentTarget.y, currentTarget.z);

    if (animationConfig.progress >= 1) {
      animationConfig.progress = 0;
    }
  });

  return <CameraControls makeDefault ref={cameraControlsRef} />;
};
