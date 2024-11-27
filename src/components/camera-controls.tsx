import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { CameraStateKeys, useCameraStore } from "@/store/app-store";
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
  const cameraConfig = useCameraStore((state) => state.cameraConfig);
  const cameraControlsRef = useRef<CameraControls>(null);
  const isInitialized = useRef(false);

  const currentPos = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls && !isInitialized.current) {
      const initialConfig = CAMERA_STATES[initialState];
      currentPos.set(...initialConfig.position);
      currentTarget.set(...initialConfig.target);
      targetPosition.set(...initialConfig.position);
      targetLookAt.set(...initialConfig.target);

      controls.setPosition(...initialConfig.position);
      controls.setTarget(...initialConfig.target);
      controls.disconnect();

      isInitialized.current = true;
    }
  }, [initialState, currentPos, currentTarget, targetPosition, targetLookAt]);

  useEffect(() => {
    if (!isInitialized.current) return;

    const { position, target } = cameraConfig;
    targetPosition.set(...position);
    targetLookAt.set(...target);
    animationConfig.progress = 0;
  }, [cameraConfig, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    const controls = cameraControlsRef.current;
    if (!controls || !isInitialized.current) return;

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
  });

  return <CameraControls ref={cameraControlsRef} />;
};
