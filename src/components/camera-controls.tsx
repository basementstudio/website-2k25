import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { CameraState, useCameraStore } from "@/store/app-store";
import { CAMERA_STATES } from "@/constants/camera-states";
import { usePathname } from "next/navigation";
import { cameraAnimationConfig } from "@/utils/animations";

const PATHNAME_MAP: Record<string, string> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
};

export const CustomCamera = () => {
  const pathname = usePathname();
  const { cameraConfig } = useCameraStore();
  const cameraControlsRef = useRef<CameraControls>(null);
  const isInitializedRef = useRef(false);

  const currentPos = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (cameraControlsRef.current) {
      cameraControlsRef.current.disconnect();
    }
  }, [cameraControlsRef]);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls && !isInitializedRef.current) {
      const initialState = PATHNAME_MAP[pathname] || "home";
      const initialConfig =
        CAMERA_STATES[initialState as keyof typeof CAMERA_STATES];

      currentPos.set(...initialConfig.position);
      currentTarget.set(...initialConfig.target);

      controls.setPosition(...initialConfig.position);
      controls.setTarget(...initialConfig.target);

      isInitializedRef.current = true;
    }
  }, [pathname, currentPos, currentTarget]);

  const controls = cameraControlsRef.current;

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const { position, target } = cameraConfig as unknown as CameraState;
    targetPosition.set(...position);
    targetLookAt.set(...target);

    cameraAnimationConfig.progress = 0;
  }, [cameraConfig, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    if (!controls || !isInitializedRef.current) return;

    cameraAnimationConfig.progress = Math.min(
      cameraAnimationConfig.progress + delta / cameraAnimationConfig.duration,
      1,
    );
    const easeValue = cameraAnimationConfig.easing(
      cameraAnimationConfig.progress,
    );

    controls.getPosition(currentPos);
    controls.getTarget(currentTarget);

    currentPos.lerp(targetPosition, easeValue);
    currentTarget.lerp(targetLookAt, easeValue);

    controls.setPosition(currentPos.x, currentPos.y, currentPos.z);
    controls.setTarget(currentTarget.x, currentTarget.y, currentTarget.z);

    if (cameraAnimationConfig.progress >= 1) {
      cameraAnimationConfig.progress = 0;
    }
  });

  return <CameraControls makeDefault ref={cameraControlsRef} />;
};
