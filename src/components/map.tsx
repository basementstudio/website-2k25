"use client";

import { useGLTF } from "@react-three/drei";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { CameraStateKeys } from "@/store/app-store";
import { useAssets } from "./assets-provider";
import { useMemo } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { RoutingElement } from "./routing-element";
import { createShaderMaterial } from "@/shaders/custom-shader-material";

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
};

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const Map = ({ handleNavigation }: MapProps) => {
  const { map } = useAssets();
  const { scene } = useGLTF(map) as unknown as GLTFResult;

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

      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene: clonedScene, removedNodes };
  }, [scene]);

  return (
    <group dispose={null}>
      <primitive object={traversedScene.scene} />
      {traversedScene.removedNodes.map((node) => (
        <RoutingElement
          key={node.name}
          node={node}
          handleNavigation={handleNavigation}
        />
      ))}
    </group>
  );
};
