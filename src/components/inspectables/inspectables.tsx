"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { FrontSide, Mesh, PerspectiveCamera, Vector3 } from "three";
import { useAssets } from "@/components/assets-provider";

import { Inspectable } from "./inspectable";
import { useInspectable } from "./context";

const HARDCODED_INSPECTABLES_POSITIONS = [
  { x: 2, y: 2.82, z: -11.6 },
  { x: 2, y: 4.08, z: -13.8 },
  { x: 2, y: 4, z: -12.3 },
  { x: 2, y: 5.15, z: -16 },
];

export const Inspectables = () => {
  const { inspectables } = useAssets();

  const { selected } = useInspectable();

  const ref = useRef<Mesh>(null);

  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useEffect(() => {
    if (!ref.current) return;

    if (selected) {
      const fov = (camera.fov * Math.PI) / 180;
      const distance = camera.position.distanceTo(ref.current.position);
      const height = 2 * Math.tan(fov / 2) * distance;
      const width = height * camera.aspect;

      ref.current.scale.set(width, height, 1);

      const direction = new Vector3();
      camera.getWorldDirection(direction);

      const targetPosition = {
        x: camera.position.x + direction.x * 1.5,
        y: camera.position.y + direction.y * 1.5,
        z: camera.position.z + direction.z * 1.5,
      };

      ref.current.position.set(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z,
      );

      ref.current.lookAt(camera.position);
    }
  }, [selected, ref, camera]);

  return (
    <>
      {inspectables.map((inspectable, index) => (
        <Inspectable
          key={inspectable.id}
          inspectable={{
            ...inspectable,
            position: HARDCODED_INSPECTABLES_POSITIONS[index],
          }}
        />
      ))}

      {selected && (
        <mesh
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={(e) => e.stopPropagation()}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            side={FrontSide}
            transparent
            color="black"
            opacity={0.95}
          />
        </mesh>
      )}
    </>
  );
};
