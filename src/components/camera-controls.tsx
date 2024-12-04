import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Mesh, ShaderMaterial, Vector3, LineSegments } from "three";
import { CameraState, useCameraStore } from "@/store/app-store";
import { CAMERA_STATES } from "@/constants/camera-states";
import { usePathname } from "next/navigation";
import { cameraAnimationConfig } from "@/utils/animations";
import { animate } from "motion";

const PATHNAME_MAP: Record<string, string> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
};

export const CustomCamera = () => {
  const pathname = usePathname();
  const scene = useThree((state) => state.scene);
  const { cameraConfig } = useCameraStore();
  const cameraControlsRef = useRef<CameraControls>(null);
  const isInitializedRef = useRef(false);
  const previousCameraState = useRef<string | null>(null);

  const currentPos = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  const animateShader = useCallback(
    (start: number, end: number) => {
      scene.traverse((child) => {
        if ("material" in child) {
          const materialChild = child as Mesh | LineSegments;
          if (
            materialChild.material instanceof ShaderMaterial &&
            materialChild.material.name === "reveal-solid-shader"
          ) {
            animate(start, end, {
              duration: 1.5,
              onUpdate: (latest) => {
                (
                  materialChild.material as ShaderMaterial
                ).uniforms.uProgress.value = latest;
              },
            });
          }
        }
      });
    },
    [scene],
  );

  useEffect(() => {
    const isMenuTransition =
      previousCameraState.current === "menu" || cameraConfig.name === "menu";

    if (isMenuTransition) {
      animateShader(
        cameraConfig.name === "menu" ? 0 : 1,
        cameraConfig.name === "menu" ? 1 : 0,
      );
    }

    previousCameraState.current = cameraConfig.name;
  }, [cameraConfig.name, animateShader]);

  useEffect(() => {
    cameraControlsRef.current?.disconnect();
  }, []);

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

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const { position, target } = cameraConfig as unknown as CameraState;
    targetPosition.set(...position);
    targetLookAt.set(...target);

    cameraAnimationConfig.progress = 0;
  }, [cameraConfig, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    const controls = cameraControlsRef.current;
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
