"use client";

import { useGLTF } from "@react-three/drei";
import { useAssets } from "./assets-provider";
import { memo, useEffect, useState } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { RoutingElement } from "./routing-element";
import { Mesh, MeshStandardMaterial, Object3D, Object3DEventMap } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import {
  BASE_SHADER_MATERIAL_NAME,
  createShaderMaterial,
} from "@/shaders/custom-shader-material";

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
};

export const Map = memo(InnerMap);

function InnerMap() {
  const { map } = useAssets();
  const { scene } = useGLTF(map) as unknown as GLTFResult;

  const [mainScene, setMainScene] = useState<Object3D<Object3DEventMap> | null>(
    null,
  );

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({});

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {};
    const clonedScene = scene.clone(true);

    CLICKABLE_NODES.forEach((node) => {
      const child = clonedScene.getObjectByName(`${node.name}`);

      console.log(child, node.name, "found child");

      if (child) {
        child.removeFromParent();
        routingNodes[node.name] = child as Mesh;
      }
    });

    // Replace materials
    clonedScene.traverse((child) => {
      if ("isMesh" in child) {
        const meshChild = child as Mesh;

        const ommitNode = Boolean(
          CLICKABLE_NODES.find((n) => n.name === meshChild.name)?.name,
        );
        if (ommitNode) return;

        const alreadyReplaced =
          (meshChild.material as MeshStandardMaterial)?.name ===
          BASE_SHADER_MATERIAL_NAME;

        if (alreadyReplaced) return;

        const newMaterial = createShaderMaterial(
          meshChild.material as MeshStandardMaterial,
          false,
        );
        meshChild.material = newMaterial;
      }
    });
    setMainScene(clonedScene);

    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes,
    }));
  }, [scene]);

  if (!mainScene) return null;

  return (
    <group>
      <primitive object={mainScene} />
      {Object.values(routingNodes).map((node) => (
        <RoutingElement key={node.name} node={node} />
      ))}
    </group>
  );
}
