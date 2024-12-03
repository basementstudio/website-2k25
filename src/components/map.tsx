"use client";

import { useGLTF } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";
import { useMemo } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Group } from "three/examples/jsm/libs/tween.module.js";
import { CreateShaderMaterial } from "@/shaders/custom-shader-material";

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh | Group;
  };
  materials: {
    [key: string]: MeshStandardMaterial;
  };
};

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const Map = ({ handleNavigation }: MapProps) => {
  const router = useRouter();

  const { scene } = useGLTF("/models/office.glb") as unknown as GLTFResult;

  const traversedScene = useMemo(() => {
    const removedNodes: Object3D[] = [];

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = CreateShaderMaterial(
          (child as Mesh).material as MeshStandardMaterial,
        );
      }
      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene, removedNodes };
  }, [scene]);

  return (
    <>
      <group dispose={null}>
        <primitive object={traversedScene.scene} />
        {traversedScene.removedNodes.map((node) => {
          const groupNode = node as { isGroup: boolean } & Object3D;
          return (
            <group
              key={groupNode.name}
              onPointerEnter={() =>
                router.prefetch(
                  CLICKABLE_NODES.find((n) => n.name === groupNode.name)
                    ?.route ?? "",
                )
              }
              onClick={() =>
                handleNavigation(
                  CLICKABLE_NODES.find((n) => n.name === groupNode.name)
                    ?.route ?? "",
                  CLICKABLE_NODES.find((n) => n.name === groupNode.name)
                    ?.routeName ?? "home",
                )
              }
              position={groupNode.isGroup ? groupNode.position : undefined}
              rotation={groupNode.isGroup ? groupNode.rotation : undefined}
              scale={groupNode.isGroup ? groupNode.scale : undefined}
            >
              {groupNode.isGroup ? (
                <>
                  {groupNode.children.map((child) => (
                    <primitive key={child.name} object={child} />
                  ))}
                </>
              ) : (
                <primitive object={groupNode} />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};
