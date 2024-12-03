"use client";

import { useGLTF } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";
import { useAssets } from "./assets-provider";
import { useMemo } from "react";
import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Mesh, Object3D, Object3DEventMap } from "three";
import { Group } from "three/examples/jsm/libs/tween.module.js";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh | Group;
  };
};

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

interface ClickableElementProps {
  node: Object3D<Object3DEventMap>;
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

const ClickableElement = ({
  node,
  handleNavigation,
}: ClickableElementProps) => {
  const router = useRouter();
  // @ts-expect-error - Object3D doesn't have isGroup property but Three.js adds it at runtime
  const isGroup = node.isGroup;

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
      position={isGroup ? node.position : undefined}
      rotation={isGroup ? node.rotation : undefined}
      scale={isGroup ? node.scale : undefined}
    >
      {isGroup ? (
        <>
          {node.children.map((child) => (
            <primitive key={child.name} object={child} />
          ))}
        </>
      ) : (
        <primitive object={node} />
      )}
    </group>
  );
};

export const Map = ({ handleNavigation }: MapProps) => {
  const { map } = useAssets();

  const { scene } = useGLTF("office.glb") as unknown as GLTFResult;
  const traversedScene = useMemo(() => {
    const removedNodes: Object3D<Object3DEventMap>[] = [];

    scene.traverse((child) => {
      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene, removedNodes };
  }, [scene]);

  return (
    <group dispose={null}>
      <primitive object={traversedScene.scene} />
      {traversedScene.removedNodes.map((node) => (
        <ClickableElement
          key={node.name}
          node={node}
          handleNavigation={handleNavigation}
        />
      ))}
    </group>
  );
};
