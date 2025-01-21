import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { RoutingPlane } from "./routing-plane/routing-plane"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useThree } from "@react-three/fiber"

interface RoutingElementProps {
  node: Mesh
  frameData: {
    position: [number, number, number]
    rotation: [number, number, number]
    size: [number, number]
    hoverName: string
  }
}

export const RoutingElement = ({ node, frameData }: RoutingElementProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const setCursorType = useMouseStore((state) => state.setCursorType)

  const scene = useThree((state) => state.scene)
  const stair3 = scene.getObjectByName("SM_Stair3") as Mesh
  const [hover, setHover] = useState(false)

  const route = useMemo(() => {
    const routeName = node.name.split("_")[0].toLowerCase()
    return routeName === "home" ? "/" : `/${routeName}`
  }, [node.name])

  const activeRoute = useMemo(() => {
    return pathname === route
  }, [pathname, route])

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

  return (
    <>
      <group
        onPointerEnter={() => {
          if (activeRoute) return
          router.prefetch(route)
          setHover(true)
          setCursorType("click")
          setHoverText(frameData.hoverName)
        }}
        onPointerLeave={() => {
          if (activeRoute) return
          setHover(false)
          setHoverText(null)
          setCursorType("default")
        }}
        onClick={() => {
          if (activeRoute) return
          handleNavigation(route)
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
        <RoutingPlane
          position={frameData.position}
          rotation={frameData.rotation}
          size={frameData.size}
        />
      )}
    </>
  )
}
