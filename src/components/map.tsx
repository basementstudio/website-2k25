import { useGLTF } from "@react-three/drei";
import { Mesh, Object3D } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { useRouter } from "next/navigation";
import { CameraStateKeys } from "@/store/app-store";
import { useAssets } from "./assets-provider";
import { useMemo } from "react";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
};

interface MapProps {
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

const clickableNodes: {
  name: string;
  route: string;
  routeName: CameraStateKeys;
}[] = [
  {
    name: "SM_BasketballHoop",
    route: "/basketball",
    routeName: "hoop",
  },
  {
    name: "SM_ArcadeLab",
    route: "/arcade",
    routeName: "arcade",
  },
  {
    name: "SM_Stairs001",
    route: "/about",
    routeName: "stairs",
  },
];

export const Map = ({ handleNavigation }: MapProps) => {
  const router = useRouter();
  const { map } = useAssets();
  console.log(map);
  const { scene, nodes } = useGLTF(map) as unknown as GLTFResult;

  const traversedScene = useMemo(() => {
    const removedNodes: Object3D[] = [];

    scene.traverse((child) => {
      if (clickableNodes.some((node) => node.name === child.name)) {
        removedNodes.push(child);
      }
    });

    return { scene, removedNodes };
  }, [scene]);

  console.log(traversedScene);

  return (
    <group dispose={null}>
      <primitive object={traversedScene.scene} />

      {traversedScene.removedNodes.map((node) => {
        console.log(node);

        return (
          <group
            key={node.name}
            onPointerEnter={() =>
              router.prefetch(
                clickableNodes.find((n) => n.name === node.name)?.route ?? "",
              )
            }
            onClick={() =>
              handleNavigation(
                clickableNodes.find((n) => n.name === node.name)?.route ?? "",
                clickableNodes.find((n) => n.name === node.name)?.routeName ??
                  "home",
              )
            }
          >
            <primitive object={node} />
          </group>
        );
      })}
    </group>
  );
};
