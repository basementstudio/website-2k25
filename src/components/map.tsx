"use client";

import { useGLTF } from "@react-three/drei";
import { Object3D } from "three";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";
import { useAssets } from "./assets-provider";
import { useMemo } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const Map = ({ handleNavigation }: MapProps) => {
  const router = useRouter();
  const { map } = useAssets();

  const { scene } = useGLTF("/office.glb");
  const traversedScene = useMemo(() => {
    const removedNodes: Object3D[] = [];

    scene.traverse((child) => {
      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene, removedNodes };
  }, [scene]);

  console.log(traversedScene.removedNodes);

  return (
    <group dispose={null}>
      {/* <primitive object={traversedScene.scene} /> */}

      {traversedScene.removedNodes.map((node) => {
        if (node.isGroup)
          return (
            <group key={node.name}>
              {node.children.map((child) => (
                <primitive key={child.name} object={child} />
              ))}
            </group>
          );

        return null;

        return (
          <group
            key={node.name}
            onPointerEnter={() =>
              router.prefetch(
                CLICKABLE_NODES.find((n) => n.name === node.name)?.route ?? "",
              )
            }
            onClick={() =>
              handleNavigation(
                CLICKABLE_NODES.find((n) => n.name === node.name)?.route ?? "",
                CLICKABLE_NODES.find((n) => n.name === node.name)?.routeName ??
                  "home",
              )
            }
          >
            <primitive object={node} />
          </group>
        );
      })}
    </group>
  );
};
