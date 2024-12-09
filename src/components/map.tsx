"use client";

import { useGLTF } from "@react-three/drei";

import { CameraStateKeys } from "@/store/app-store";
import { useAssets } from "./assets-provider";
import { memo, useMemo } from "react";
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

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const Map = memo(InnerMap);

function InnerMap({ handleNavigation }: MapProps) {
  const { map } = useAssets();

  const { scene } = useGLTF(map) as unknown as GLTFResult;

  const traversedScene = useMemo(() => {
    console.log("Traversing scene", scene.uuid);

    const routingNodes: Object3D<Object3DEventMap>[] = [];

    CLICKABLE_NODES.forEach((node) => {
      const child = scene.getObjectByName(node.name);
      if (child) {
        child.removeFromParent();
        routingNodes.push(child);
      }
    });

    return { scene, routingNodes };
  }, [map, scene.uuid]);

  return (
    <group>
      <primitive object={traversedScene.scene} />
      {traversedScene.routingNodes.map((node) => (
        <RoutingElement
          key={node.name}
          node={node}
          handleNavigation={handleNavigation}
        />
      ))}
    </group>
  );
}
