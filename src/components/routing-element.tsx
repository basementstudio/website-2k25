import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { CameraStateKeys } from "@/store/app-store";
import { useRouter } from "next/navigation";
import { Object3D, Object3DEventMap } from "three";

interface RoutingElementProps {
  node: Object3D<Object3DEventMap> & { isGroup?: boolean };
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const RoutingElement = ({
  node,
  handleNavigation,
}: RoutingElementProps) => {
  const router = useRouter();

  return (
    <group
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
      position={node.isGroup ? node.position : undefined}
      rotation={node.isGroup ? node.rotation : undefined}
      scale={node.isGroup ? node.scale : undefined}
    >
      {node.isGroup ? (
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
