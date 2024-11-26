import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import type { CameraConfig } from "@/store/camera-store";

export const CameraControls = ({ position, target }: CameraConfig) => {
  const {
    camera,
    gl: { domElement },
  } = useThree();
  const ref = useRef<any>(null);

  const targetPosition = useRef(
    position
      ? new Vector3(position.x, position.y, position.z)
      : camera.position.clone(),
  );
  const targetLookAt = useRef(
    target ? new Vector3(target.x, target.y, target.z) : new Vector3(),
  );

  camera.up = new Vector3(0, 1, 0);

  const animConfig = {
    duration: 2,
    progress: 0,
    easing: (x: number) => x * x * (3 - 2 * x),
  };

  useFrame((_state, delta) => {
    if (ref.current && position && target) {
      animConfig.progress = Math.min(
        animConfig.progress + delta / animConfig.duration,
        1,
      );
      const easeValue = animConfig.easing(animConfig.progress);

      camera.position.lerp(
        targetPosition.current.set(position.x, position.y, position.z),
        easeValue,
      );

      ref.current.target.lerp(
        targetLookAt.current.set(target.x, target.y, target.z),
        easeValue,
      );

      if (animConfig.progress >= 1) {
        animConfig.progress = 0;
      }
    }
  });

  return (
    <OrbitControls
      ref={ref}
      args={[camera, domElement]}
      panSpeed={1}
      maxPolarAngle={Math.PI / 2}
    />
  );
};
