import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"
import { RoutingPlane } from "./routing-plane/routing-plane"
import { RoutingArrow } from "./routing-arrow"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useThree } from "@react-three/fiber"

interface RoutingElementProps {
  node: Mesh
}

export const RoutingElement = ({ node }: RoutingElementProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const setCursorType = useMouseStore((state) => state.setCursorType)

  const scene = useThree((state) => state.scene)
  const stair3 = scene.getObjectByName("SM_Stair3") as Mesh
  const [hover, setHover] = useState(false)

  const routeConfig = useMemo(() => {
    const routeName = node.name
    const conf = CLICKABLE_NODES.find((n) => n.name === routeName)

    return conf
  }, [node.name])

  const activeRoute = useMemo(() => {
    return pathname === routeConfig?.route
  }, [pathname, routeConfig?.route])

  const meshRef = useRef<Mesh | null>(null)

  useEffect(() => {
    if (activeRoute) {
      setHover(false)
    }
  }, [activeRoute])

  const handleNavigation = useCallback(
    (route: string) => {
      if (!stair3) return

      if (route !== "/") {
        stair3.visible = true
      }

      router.push(route, { scroll: false })
    },
    [router, stair3]
  )

  // todo: smooth hover

  if (!routeConfig) return null

  return (
    <>
      <group
        onPointerEnter={() => {
          if (activeRoute) return
          router.prefetch(routeConfig.route)
          setHover(true)
          setCursorType("click")
          setHoverText(routeConfig.hoverText || null)
        }}
        onPointerLeave={() => {
          if (activeRoute) return
          setHover(false)
          setHoverText(null)
          setCursorType("default")
        }}
        onClick={() => {
          if (activeRoute) return
          handleNavigation(routeConfig.route)
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
            opacity={hover ? 0.0 : 0}
            transparent
            depthTest={false}
            wireframe={true}
            wireframeLinewidth={1}
          />
        </mesh>
      </group>
      {hover && (
        <>
          {routeConfig.frameType === "plane" && (
            <RoutingPlane
              position={routeConfig.framePosition}
              rotation={routeConfig.frameRotation}
              size={routeConfig.frameSize}
            />
          )}
          {routeConfig.arrowScale && (
            <RoutingArrow
              position={
                routeConfig.arrowPosition
                  ? new Vector3(
                      node.position.x + routeConfig.arrowPosition[0],
                      node.position.y + routeConfig.arrowPosition[1],
                      node.position.z + routeConfig.arrowPosition[2]
                    )
                  : new Vector3(
                      node.position.x,
                      node.position.y,
                      node.position.z
                    )
              }
              rotation={routeConfig.arrowRotation}
              scale={routeConfig.arrowScale}
            />
          )}
        </>
      )}
    </>
  )
}
