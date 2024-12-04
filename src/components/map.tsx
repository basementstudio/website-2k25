"use client";

import { useGLTF } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";
import { memo, useMemo } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Mesh, MeshStandardMaterial, Object3D, ShaderMaterial } from "three";
import { Group } from "three/examples/jsm/libs/tween.module.js";
import { createShaderMaterial } from "@/shaders/custom-shader-material";
import { useFrame } from "@react-three/fiber";
import { shaderAnimationConfig } from "@/utils/animations";

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

export const Map = memo(MapInner);

function MapInner({ handleNavigation }: MapProps) {
  const router = useRouter();
  const { scene } = useGLTF("/models/office.glb") as unknown as GLTFResult;

  const traversedScene = useMemo(() => {
    const removedNodes: Object3D[] = [];
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh;
        const newMaterial = createShaderMaterial(
          meshChild.material as MeshStandardMaterial,
          false,
        );
        meshChild.material = newMaterial;
      }

      // remove clickable nodes
      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene: clonedScene, removedNodes };
  }, [scene]);

  useFrame(({ clock }) => {
    traversedScene.scene.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh;
        if (meshChild.material instanceof ShaderMaterial) {
          const elapsed =
            clock.getElapsedTime() - shaderAnimationConfig.startTime;
          const progress = Math.min(
            elapsed / shaderAnimationConfig.duration,
            1,
          );

          meshChild.material.uniforms.uProgress.value =
            shaderAnimationConfig.easing(progress) *
              (shaderAnimationConfig.endValue -
                shaderAnimationConfig.startValue) +
            shaderAnimationConfig.startValue;
        }
      }
    });
  });

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
}
