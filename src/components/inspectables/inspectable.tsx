"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Vector3, Quaternion, Matrix4, Box3 } from "three";
import { useInspectable } from "./context";

interface InspectableProps {
  inspectable: {
    url: string;
    position: { x: number; y: number; z: number };
    id: string;
  };
}

export const Inspectable = ({ inspectable }: InspectableProps) => {
  const { scene } = useGLTF(inspectable.url);

  const memoizedScene = useMemo(() => scene.clone(), [scene]);

  const { camera } = useThree();

  const [isInspecting, setIsInspecting] = useState(false);

  const ref = useRef<Group>(null);

  const [size, setSize] = useState<Vector3>(new Vector3(0, 0, 0));

  const position = useMotionValue(inspectable.position);
  const quaternion = useMotionValue(new Quaternion());
  const scale = useMotionValue(1);

  const { setSelected } = useInspectable();

  useEffect(() => {
    if (ref.current) {
      const boundingBox = new Box3().setFromObject(memoizedScene);
      const size = new Vector3();
      boundingBox.getSize(size);

      // TODO: the center should come from the glb file
      const center = new Vector3();
      boundingBox.getCenter(center);
      memoizedScene.position.sub(center);

      setSize(size);
    }
  }, [scene]);

  useEffect(() => {
    setSelected(isInspecting ? inspectable.id : "");
  }, [isInspecting]);

  useFrame(() => {
    if (ref.current) {
      const direction = new Vector3();
      camera.getWorldDirection(direction);

      const targetPosition = isInspecting
        ? {
            x: camera.position.x + direction.x,
            y: camera.position.y + direction.y,
            z: camera.position.z + direction.z,
          }
        : {
            x: inspectable.position.x,
            y: inspectable.position.y,
            z: inspectable.position.z,
          };

      const maxDimension = Math.max(size.x, size.y, size.z);

      const targetSize = 0.75;

      const targetScale = isInspecting ? targetSize / maxDimension : 1;

      const smoothFactor = 0.1;

      const oldPos = position.get();

      position.set({
        x: oldPos.x + (targetPosition.x - oldPos.x) * smoothFactor,
        y: oldPos.y + (targetPosition.y - oldPos.y) * smoothFactor,
        z: oldPos.z + (targetPosition.z - oldPos.z) * smoothFactor,
      });

      scale.set(scale.get() + (targetScale - scale.get()) * smoothFactor);

      ref.current.position.set(
        position.get().x,
        position.get().y,
        position.get().z,
      );

      ref.current.scale.set(scale.get(), scale.get(), scale.get());

      if (isInspecting) {
        const targetQuaternion = new Quaternion();
        const lookAtMatrix = new Matrix4();
        const upVector = new Vector3(0, 1, 0);

        lookAtMatrix.lookAt(ref.current.position, camera.position, upVector);
        targetQuaternion.setFromRotationMatrix(lookAtMatrix);

        const rotationX = new Quaternion();
        rotationX.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        targetQuaternion.multiply(rotationX);

        const currentQuaternion = new Quaternion(
          quaternion.get().x,
          quaternion.get().y,
          quaternion.get().z,
          quaternion.get().w,
        );

        currentQuaternion.slerp(targetQuaternion, smoothFactor);

        quaternion.set(currentQuaternion);

        ref.current.quaternion.copy(currentQuaternion);
      } else {
        const targetQuaternion = new Quaternion();
        const currentQuaternion = new Quaternion(
          quaternion.get().x,
          quaternion.get().y,
          quaternion.get().z,
          quaternion.get().w,
        );
        currentQuaternion.slerp(targetQuaternion, smoothFactor);

        quaternion.set(currentQuaternion);

        ref.current.quaternion.copy(currentQuaternion);
      }
    }
  });

  return (
    <>
      <group onClick={() => setIsInspecting(!isInspecting)} ref={ref}>
        <primitive object={memoizedScene} />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[size.x, size.y, size.z]} key={size.x} />
          <meshBasicMaterial color="red" transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};
