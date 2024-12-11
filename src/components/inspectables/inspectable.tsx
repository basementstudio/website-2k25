"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Group,
  Vector3,
  Quaternion,
  Matrix4,
  Box3,
  PerspectiveCamera,
} from "three";
import { useInspectable } from "./context";
import { PresentationControls } from "./presentation-controls";

interface InspectableProps {
  inspectable: {
    url: string;
    position: { x: number; y: number; z: number };
    id: string;
  };
}

export const Inspectable = ({ inspectable }: InspectableProps) => {
  const { scene } = useGLTF(inspectable.url);
  const { selected } = useInspectable();
  const [boundingBox, setBoundingBox] = useState<number[]>([0, 0, 0]);

  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  const [isInspecting, setIsInspecting] = useState(false);

  const ref = useRef<Group>(null);
  const primitiveRef = useRef<Group>(null);

  const position = useMotionValue(inspectable.position);
  const quaternion = useMotionValue(new Quaternion());
  const scale = useMotionValue(1);

  const { setSelected } = useInspectable();

  useEffect(() => {
    if (ref.current) {
      const boundingBox = new Box3().setFromObject(scene);
      const size = new Vector3();
      boundingBox.getSize(size);

      const center = new Vector3();
      boundingBox.getCenter(center);
      scene.position.sub(center);

      setBoundingBox([size.x, size.y, size.z]);
    }
  }, [scene]);

  useEffect(() => {
    setIsInspecting(selected === inspectable.id);
  }, [selected, inspectable]);

  useFrame(() => {
    if (ref.current) {
      const direction = new Vector3();
      camera.getWorldDirection(direction);

      const offset = new Vector3(0, 1, 0).cross(direction).normalize();

      const viewportWidth = Math.min(camera.aspect, 1.855);
      const xOffset = viewportWidth * 0.128;

      direction.add(offset.multiplyScalar(-xOffset));

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

      const maxDimension = Math.max(...boundingBox);

      const targetSize = 0.5;

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

      const targetQuaternion = new Quaternion();

      if (isInspecting) {
        const lookAtMatrix = new Matrix4();
        const upVector = new Vector3(0, 1, 0);

        lookAtMatrix.lookAt(ref.current.position, camera.position, upVector);
        targetQuaternion.setFromRotationMatrix(lookAtMatrix);

        const rotationX = new Quaternion();
        rotationX.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        targetQuaternion.multiply(rotationX);
      }

      const q = quaternion.get();
      const currentQuaternion = new Quaternion(q.x, q.y, q.z, q.w);
      currentQuaternion.slerp(targetQuaternion, smoothFactor);
      quaternion.set(currentQuaternion);
      primitiveRef.current?.quaternion.copy(currentQuaternion);
    }
  });

  return (
    <>
      <group onClick={() => setSelected(inspectable.id)} ref={ref}>
        <PresentationControls
          key={inspectable.id}
          enabled={selected === inspectable.id}
          global={false}
          cursor={selected === inspectable.id}
          snap={true}
          speed={2}
        >
          <group ref={primitiveRef}>
            <primitive object={scene} />
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[...boundingBox]} key={scene.name} />
              <meshBasicMaterial transparent opacity={0.5} />
            </mesh>
          </group>
        </PresentationControls>
      </group>
    </>
  );
};
