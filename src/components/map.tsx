"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useAssets } from "./assets-provider";
import { memo, useEffect, useState } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { RoutingElement } from "./routing-element";
import {
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  Object3D,
  Object3DEventMap,
  Texture,
} from "three";
import { EXRLoader, GLTF } from "three/examples/jsm/Addons.js";
import {
  BASE_SHADER_MATERIAL_NAME,
  createShaderMaterial,
} from "@/shaders/custom-shader-material";
import { useLoader } from "@react-three/fiber";

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

  const [SM_PB_Floor, SM_RackWood009, SM_RackWood018, SM_Stairs001] = useLoader(
    EXRLoader,
    [
      "/lightmaps/SM_PB_Floor_Bake1_PBR_Lightmap.exr",
      "/lightmaps/SM_RackWood.009_Bake1_PBR_Lightmap.exr",
      "/lightmaps/SM_RackWood.018_Bake1_PBR_Lightmap.exr",
      "/lightmaps/SM_Stairs.001_Bake1_PBR_Lightmap.exr",
    ],
  );

  const lightmaps = {
    SM_PB_Floor,
    SM_RackWood009,
    SM_RackWood018,
    SM_Stairs001,
  };

  SM_PB_Floor.flipY = true;
  SM_PB_Floor.magFilter = NearestFilter;
  SM_RackWood009.flipY = true;
  SM_RackWood009.magFilter = NearestFilter;
  SM_RackWood018.flipY = true;
  SM_RackWood018.magFilter = NearestFilter;
  SM_Stairs001.flipY = true;
  SM_Stairs001.magFilter = NearestFilter;

  const [routingNodes, setRoutingNodes] = useState<Record<string, Mesh>>({});

  useEffect(() => {
    const routingNodes: Record<string, Mesh> = {};

    CLICKABLE_NODES.forEach((node) => {
      const child = scene.getObjectByName(`${node.name}`);

      if (child) {
        child.removeFromParent();
        routingNodes[node.name] = child as Mesh;
      }
    });

    // Replace materials
    scene.traverse((child) => {
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

        const meshName = meshChild.name;
        const lightMap = lightmaps[meshName as keyof typeof lightmaps] || null;
        const newMaterial = createShaderMaterial(
          meshChild.material as MeshStandardMaterial,
          lightMap,
          false,
        );
        meshChild.material = newMaterial;
      }
    });
    setMainScene(scene);

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
