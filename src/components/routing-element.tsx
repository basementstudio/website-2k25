import { useCursor } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { CLICKABLE_NODES } from "@/constants/clickable-elements"

interface RoutingElementProps {
  node: Mesh
}

export const RoutingElement = ({ node }: RoutingElementProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const scene = useThree((state) => state.scene)
  const stair3 = scene.getObjectByName("SM_Stair3") as Mesh

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
    <group
      onPointerEnter={() => {
        if (activeRoute) return
        router.prefetch(routeConfig.route)
        setHover(true)
      }}
      onPointerLeave={() => {
        if (activeRoute) return
        setHover(false)
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
          opacity={hover ? 0.2 : 0}
          transparent
          depthTest={false}
        />
      </mesh>
    </group>
  )
}
