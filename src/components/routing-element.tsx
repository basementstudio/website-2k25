import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import { CameraStateKeys, useCameraStore } from "@/store/app-store";
import { useCursor } from "@react-three/drei";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mesh } from "three";

interface RoutingElementProps {
  node: Mesh;
}

export const RoutingElement = ({ node }: RoutingElementProps) => {
  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const pathname = usePathname();

  const handleNavigation = useCallback(
    (route: string, cameraState: CameraStateKeys) => {
      setCameraState(cameraState);
      router.push(route);
    },
    [router, setCameraState],
  );

  const [hover, setHover] = useState(false);

  useCursor(hover);

  const routeConfig = useMemo(() => {
    const routeName = node.name.replace("_Hover", "");
    const conf = CLICKABLE_NODES.find((n) => n.name === routeName);

    return conf;
  }, [node.name]);

  const activeRoute = useMemo(() => {
    return pathname === routeConfig?.route;
  }, [pathname, routeConfig?.route]);

  const meshRef = useRef<Mesh | null>(null);

  useEffect(() => {
    if (activeRoute) {
      setHover(false);
    }
  }, [activeRoute]);

  // todo: smooth hover

  if (!routeConfig) return null;

  return (
    <group
      onPointerEnter={() => {
        if (activeRoute) return;
        router.prefetch(routeConfig.route);
        setHover(true);
      }}
      onPointerLeave={() => {
        if (activeRoute) return;
        setHover(false);
      }}
      onClick={() => {
        if (activeRoute) return;
        handleNavigation(routeConfig.route, routeConfig.routeName);
      }}
    >
      <mesh
        ref={meshRef}
        geometry={node.geometry}
        position={node.position}
        scale={node.scale}
        rotation={node.rotation}
      >
        <meshBasicMaterial
          color="white"
          opacity={hover ? 0.5 : 0}
          transparent
          depthTest={false}
        />
      </mesh>
    </group>
  );
};
