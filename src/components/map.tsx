"use client";

"use client";

import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";

type GLTFResult = GLTF & {
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
    const routingNodes: Object3D<Object3DEventMap>[] = [];

    scene.traverse((child) => {
      if (CLICKABLE_NODES.some((node) => node.name === child.name)) {
        routingNodes.push(child);
      }
    });

    return { scene, routingNodes };
  }, [scene]);

  return (
    <group dispose={null}>
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
};
