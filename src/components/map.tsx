"use client";

import { useGLTF } from "@react-three/drei";
import { useAssets } from "./assets-provider";
import { memo, useEffect, useState } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Mesh, Object3D, Object3DEventMap } from "three";
import { Group } from "three/examples/jsm/libs/tween.module.js";
import { RoutingElement } from "./routing-element";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh | Group;
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
    setMainScene(scene);

    const routingNodes: Record<string, Mesh> = {};

    CLICKABLE_NODES.forEach((node) => {
      const child = scene.getObjectByName(`${node.name}_Hover`);

      if (child) {
        child.removeFromParent();
        routingNodes[node.name] = child as Mesh;
      }
    });

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
