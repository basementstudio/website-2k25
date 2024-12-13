import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Mesh,
  ShaderMaterial,
  Vector3,
  LineSegments,
  PerspectiveCamera,
  Vector2,
} from "three";
import {
  CameraState,
  CameraStateKeys,
  useCameraStore,
} from "@/store/app-store";
import {
  CAMERA_STATES,
  PROJECTS_CAMERA_SENSITIVITY,
} from "@/constants/camera-states";
import { usePathname } from "next/navigation";
import { cameraAnimationConfig } from "@/utils/animations";
import { animate } from "motion";
import { BASE_SHADER_MATERIAL_NAME } from "@/shaders/custom-shader-material";
import { useGesture } from "@use-gesture/react";
import { useMotionValue, useSpring } from "motion/react";
import { useInspectable } from "./inspectables/context";
import { useMousePosition } from "@/hooks/use-mouse-position";

const PATHNAME_MAP: Record<string, CameraStateKeys> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
  "/projects": "projects",
};

export const CustomCamera = () => {
  const pathname = usePathname();
  const scene = useThree((state) => state.scene);
  const { cameraConfig, cameraState } = useCameraStore();
  const { selected } = useInspectable();
  const cameraControlsRef = useRef<CameraControls>(null);
  const isInitializedRef = useRef(false);
  const previousCameraState = useRef<string | null>(null);

  const currentPos = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const offsetXSpring = useSpring(offsetX, {
    stiffness: 64,
    damping: 16,
    mass: 1,
  });
  const offsetYSpring = useSpring(offsetY, {
    stiffness: 64,
    damping: 16,
    mass: 1,
  });

  const mouseUV = useMousePosition((s) => s.uv);
  const smoothMouseUv = useMemo(() => new Vector2(0.5, 0.5), []);

  useEffect(() => {
    offsetX.set(0);
    offsetY.set(0);
  }, [cameraState, cameraConfig, offsetX, offsetY]);

  const animateShader = useCallback(
    (start: number, end: number) => {
      scene.traverse((child) => {
        if ("material" in child) {
          const materialChild = child as Mesh | LineSegments;
          if (
            materialChild.material instanceof ShaderMaterial &&
            materialChild.material.name === BASE_SHADER_MATERIAL_NAME
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

    if (cameraAnimationConfig.progress < 1) {
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
    }

    if (
      cameraState === "projects" &&
      cameraAnimationConfig.progress >= 1 &&
      !selected
    ) {
      const springX = offsetXSpring.get();
      const springY = offsetYSpring.get();
      const baseTarget = CAMERA_STATES.projects.target;
      const basePosition = CAMERA_STATES.projects.position;

      controls.setTarget(
        baseTarget[0],
        baseTarget[1] + springY,
        baseTarget[2] + springX,
      );

      controls.setPosition(
        basePosition[0],
        basePosition[1],
        basePosition[2] + springX,
      );
    }

    if (cameraAnimationConfig.progress >= 1) {
      const rotationAngle = cameraConfig.rotationAngle || [0, 0];
      const rotationLerp = cameraConfig.rotationLerp || 0.03;

      smoothMouseUv.lerp(
        new Vector2(mouseUV.x, mouseUV.y),
        Math.min(rotationLerp * delta * 100, 1),
      );

      const springX = (smoothMouseUv.x - 0.5) * rotationAngle[0];
      const springY = (smoothMouseUv.y - 0.5) * rotationAngle[1];

      if (cameraState === "menu") {
        const baseTarget = CAMERA_STATES.menu.target;
        const basePosition = CAMERA_STATES.menu.position;

        controls.setTarget(baseTarget[0], baseTarget[1], baseTarget[2]);

        controls.setPosition(
          basePosition[0] + springX,
          basePosition[1] + springY,
          basePosition[2],
        );
      } else if (cameraState === "projects" && !selected) {
        const baseTarget = CAMERA_STATES.projects.target;
        const basePosition = CAMERA_STATES.projects.position;

        controls.setTarget(
          baseTarget[0],
          baseTarget[1] + springY + offsetYSpring.get(),
          baseTarget[2] + springX + offsetXSpring.get(),
        );

        controls.setPosition(
          basePosition[0],
          basePosition[1],
          basePosition[2] + springX + offsetXSpring.get(),
        );
      } else {
        const baseTarget = CAMERA_STATES[cameraState].target;
        const basePosition = CAMERA_STATES[cameraState].position;

        controls.setTarget(
          baseTarget[0],
          baseTarget[1] + springY,
          baseTarget[2] + springX,
        );

        controls.setPosition(basePosition[0], basePosition[1], basePosition[2]);
      }
    }

    controls.update(delta);
  });

  useEffect(() => {
    if (cameraControlsRef.current) {
      useCameraStore
        .getState()
        .setCamera(cameraControlsRef.current.camera as PerspectiveCamera);
    }
  }, []);

  useGesture(
    {
      onDrag: ({
        delta: [x, y],
        memo = [offsetX.get(), offsetY.get()],
        first,
      }) => {
        if (cameraState !== "projects" || selected) return memo;

        if (first) {
          console.log("Started dragging in projects view");
        }

        const newX = memo[0] + x * PROJECTS_CAMERA_SENSITIVITY;
        const newY = memo[1] + y * PROJECTS_CAMERA_SENSITIVITY;

        console.log("Drag values:", { x, y, newX, newY });

        offsetX.set(newX);
        offsetY.set(newY);

        return [newX, newY];
      },
    },
    {
      target: window,
      eventOptions: { passive: false },
    },
  );

  return <CameraControls makeDefault ref={cameraControlsRef} />;
};
