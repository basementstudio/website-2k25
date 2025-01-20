import { useCursor } from "@react-three/drei"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"
import { CameraStateKeys, useCameraStore } from "@/store/app-store"

import { RoutingBox } from "./routing-box"
import { RoutingPlane } from "./routing-plane"
import { useMouseStore } from "../mouse-tracker"
import { RoutingArrow } from "./routing-arrow"

interface RoutingElementProps {
  node: Mesh
}

export const RoutingElement = ({ node }: RoutingElementProps) => {
  const router = useRouter()
  const setCameraState = useCameraStore((state) => state.setCameraState)
  const setHoverText = useMouseStore((state) => state.setHoverText)

  const pathname = usePathname()

  const handleNavigation = useCallback(
    (route: string, cameraState: CameraStateKeys) => {
      setCameraState(cameraState)
      router.push(route)
    },
    [router, setCameraState]
  )

  const [hover, setHover] = useState(false)

  useCursor(hover)

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

  // todo: smooth hover

  if (!routeConfig) return null

  return (
    <>
      <group
        onPointerEnter={() => {
          if (activeRoute) return
          router.prefetch(routeConfig.route)
          setHover(true)
          setHoverText(routeConfig.hoverText || null)
        }}
        onPointerLeave={() => {
          if (activeRoute) return
          setHover(false)
          setHoverText(null)
        }}
        onClick={() => {
          if (activeRoute) return
          handleNavigation(routeConfig.route, routeConfig.routeName)
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
          {routeConfig.frameType === "box" && (
            <RoutingBox
              position={routeConfig.framePosition}
              size={routeConfig.frameSize}
            />
          )}
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
