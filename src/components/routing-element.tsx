import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { CameraStateKeys } from "@/store/app-store";
import { useRouter } from "next/navigation";
import { Object3D, Object3DEventMap } from "three";

interface RoutingElementProps {
  node: Object3D<Object3DEventMap>;
  handleNavigation: (route: string, cameraState: CameraStateKeys) => void;
}

export const RoutingElement = ({
  node,
  handleNavigation,
}: RoutingElementProps) => {
  const router = useRouter();
  // @ts-expect-error - Object3D doesn't have isGroup property but Three.js adds it at runtime
  const isGroup = node.isGroup;

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
