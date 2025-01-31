import { useThree } from "@react-three/fiber"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { RoutingPlane } from "./routing-plane/routing-plane"

interface RoutingElementProps {
  node: Mesh
  route: string
  hoverName: string
}

export const RoutingElement = ({
  node,
  route,
  hoverName
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
      const setStairVisibility =
        useNavigationStore.getState().setStairVisibility
      const setCurrentTabIndex =
        useNavigationStore.getState().setCurrentTabIndex

      // Prevent tab index reset by setting it to -1 before navigation
      setCurrentTabIndex(-1)

      router.push(route, { scroll: false })

      if (route === "/") {
        setTimeout(() => {
          setStairVisibility(false)
        }, 2200)
      } else {
        setStairVisibility(true)
      }
    },
    [router]
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
      router.prefetch(route)
      setHoverText(hoverName)

      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          handleNavigation(route)
        }
      }
      window.addEventListener("keydown", handleKeyPress)

      return () => {
        window.removeEventListener("keydown", handleKeyPress)
        if (!isCanvasTabMode) {
          setHoverText(null)
        }
      }
    } else {
      setHover(false)
      if (!isCanvasTabMode) {
        setHoverText(null)
      }
    }
  }, [
    isCanvasTabMode,
    currentScene,
    currentTabIndex,
    node.name,
    hoverName,
    handleNavigation,
    route
  ])

  return (
    <>
      <group
        onPointerEnter={(e) => {
          e.stopPropagation()
          if (activeRoute) return
          setHover(true)
          router.prefetch(route)
          setCursorType("click")
          setHoverText(hoverName)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          if (activeRoute) return
          setHover(false)
          setHoverText(null)
          setCursorType("default")
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (activeRoute) return
          handleNavigation(route)
          setCursorType("default")
        }}
      >
        <mesh
          ref={meshRef}
          geometry={node.geometry}
          position={[node.position.x, node.position.y, node.position.z]}
          rotation={node.rotation}
        >
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
      {hover && (
        <>
          <RoutingPlane
            position={[node.position.x, node.position.y, node.position.z]}
            scale={[1, 1]}
            rotation={[node.rotation.x, node.rotation.y, node.rotation.z]}
            geometry={node.geometry}
          />
        </>
      )}
    </>
  )
}
