import { CLICKABLE_NODES } from "@/constants/clickable-elements";
import useNavigation from "@/hooks/use-navigation";
import { useCursor } from "@react-three/drei";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mesh } from "three";

interface RoutingElementProps {
  node: Mesh;
}

export const RoutingElement = ({ node }: RoutingElementProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const handleNavigation = useNavigation();
  const [hover, setHover] = useState(false);

  useCursor(hover);

  const routeConfig = useMemo(() => {
    const routeName = node.name
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
