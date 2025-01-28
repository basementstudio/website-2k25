import { useThree } from "@react-three/fiber"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { RoutingArrow } from "./routing-arrow"
import { RoutingPlane } from "./routing-plane/routing-plane"

interface RoutingElementProps {
  node: Mesh
  route: string
  frameData: {
    position: [number, number, number]
    rotation: [number, number, number]
    size: [number, number]
    hoverName: string
  }
  arrowData: {
    position: [number, number, number]
    scale: number
    rotation: [number, number, number]
  }
}

export const RoutingElement = ({
  node,
  route,
  frameData,
  arrowData
}: RoutingElementProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const { currentTabIndex, isCanvasTabMode, currentScene } =
    useNavigationStore()

  const scene = useThree((state) => state.scene)
  const stair3 = scene.getObjectByName("SM_Stair3") as Mesh
  const [hover, setHover] = useState(false)

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

  useEffect(() => {
    if (!isCanvasTabMode || !currentScene?.tabs) {
      setHover(false)
      setHoverText(null)
      return
    }

    const currentTab = currentScene.tabs[currentTabIndex]
    if (currentTab && currentTab.tabClickableName === node.name) {
      setHover(true)
      setHoverText(frameData.hoverName)

      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          handleNavigation(route)
        }
      }
      window.addEventListener("keydown", handleKeyPress)

      return () => {
        window.removeEventListener("keydown", handleKeyPress)
      }
    } else {
      setHover(false)
      setHoverText(null)
    }
  }, [
    isCanvasTabMode,
    currentScene,
    currentTabIndex,
    node.name,
    frameData.hoverName,
    handleNavigation,
    route
  ])

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
          position={[node.position.x, node.position.y, node.position.z]}
          rotation={node.rotation}
        >
          <meshBasicMaterial color="white" opacity={0} transparent />
        </mesh>
      </group>
      {hover && (
        <>
          <RoutingPlane
            position={[
              node.position.x + frameData.position[0],
              node.position.y + frameData.position[1],
              node.position.z + frameData.position[2]
            ]}
            scale={[frameData.size[0], frameData.size[1]]}
            rotation={[node.rotation.x, node.rotation.y, node.rotation.z]}
            geometry={node.geometry}
          />
          <RoutingArrow
            position={[
              node.position.x + arrowData.position[0],
              node.position.y + arrowData.position[1],
              node.position.z + arrowData.position[2]
            ]}
            scale={arrowData.scale}
            rotation={arrowData.rotation}
          />
        </>
      )}
    </>
  )
}
