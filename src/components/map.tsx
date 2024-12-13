"use client";

import { useGLTF } from "@react-three/drei";
import { useAssets } from "./assets-provider";
import { memo, useEffect, useMemo, useState } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { RoutingElement } from "./routing-element";
import {
  Material,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  Object3D,
  Object3DEventMap,
  Texture,
} from "three";
import { EXRLoader, GLTF } from "three/examples/jsm/Addons.js";
import { createShaderMaterial } from "@/shaders/custom-shader-material";
import { useLoader } from "@react-three/fiber";

export type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
};

export const Map = memo(InnerMap);

const LIGHTMAP_OBJECTS = [
  "SM__library_Wood",
  "SM_LibraryWall_01",
  "SM_PBWall_00",
  "SM_PBWall_01",
  "SM_StairsFloor",
] as const;

function useLightmaps(): Record<(typeof LIGHTMAP_OBJECTS)[number], Texture> {
  const loadedMaps = useLoader(
    EXRLoader,
    LIGHTMAP_OBJECTS.map((name) => `/lightmaps/${name}_Bake1_PBR_Lightmap.exr`),
  );

  const lightMaps = useMemo(() => {
    return loadedMaps.reduce(
      (acc, map, index) => {
        console.log(map);

        map.flipY = true;
        map.magFilter = NearestFilter;
        map.colorSpace = NoColorSpace;
        acc[LIGHTMAP_OBJECTS[index]] = map;
        return acc;
      },
      {} as Record<(typeof LIGHTMAP_OBJECTS)[number], Texture>,
    );
  }, [loadedMaps]);

  return lightMaps;
}

function InnerMap() {
  const { map } = useAssets();
  const { scene } = useGLTF(map) as unknown as GLTFResult;

  const [mainScene, setMainScene] = useState<Object3D<Object3DEventMap> | null>(
    null,
  );

  const lightmaps = useLightmaps();

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

    function getLightmap(meshName: string, material: Material) {
      const lightMap = lightmaps[meshName as keyof typeof lightmaps] || null;
      const newMaterial = createShaderMaterial(
        material as MeshStandardMaterial,
        lightMap,
        false,
      );
      return newMaterial;
    }

    function replaceMeshMaterial(mesh: Mesh, lightMap: Texture | null = null) {
      if (mesh.userData.hasGlobalMaterial) return;

      mesh.userData.hasGlobalMaterial = true;
      const newMaterial = createShaderMaterial(
        mesh.material as MeshStandardMaterial,
        lightMap,
        false,
      );
      mesh.material = newMaterial;
    }

    // Replace groups
    LIGHTMAP_OBJECTS.forEach((name) => {
      const object = scene.getObjectByName(name);

      if (!object) return;

      const lightMap = lightmaps[name as keyof typeof lightmaps];

      if (object.type === "Mesh") {
        const mesh = object as Mesh;
        replaceMeshMaterial(mesh, lightMap);
      } else if (object.type === "Group") {
        object.traverse((child) => {
          if (child.type === "Mesh") {
            replaceMeshMaterial(child as Mesh, lightMap);
          }
        });
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
        const alreadyReplaced = meshChild.userData.hasGlobalMaterial;

        if (alreadyReplaced) return;

        const currentMaterial = meshChild.material;
        const newMaterials = Array.isArray(currentMaterial)
          ? currentMaterial.map((material) => getLightmap(child.name, material))
          : getLightmap(child.name, currentMaterial);

        meshChild.material = newMaterials;

        meshChild.userData.hasGlobalMaterial = true;
      }
    });

    setMainScene(scene);

    // Split the routing nodes

    setRoutingNodes((current) => ({
      ...current,
      ...routingNodes,
    }));
  }, [scene, lightmaps]);

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
