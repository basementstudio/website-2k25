import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

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
  const {
    currentTabIndex,
    isCanvasTabMode,
    currentScene,
    scenes,
    setCurrentTabIndex
  } = useNavigationStore()
  const { handleNavigation } = useHandleNavigation()

  const [hover, setHover] = useState(false)

  const activeRoute = useMemo(() => {
    return pathname === route
  }, [pathname, route])

  const meshRef = useRef<Mesh | null>(null)

  useEffect(() => {
    if (activeRoute) setHover(false)
  }, [activeRoute])

  const navigate = useCallback(
    (route: string) => {
      handleNavigation(`${!route.startsWith("/") ? "/" : ""}${route}`)
    },
    [handleNavigation]
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
        if (event.key === "Enter" && scenes) {
          const trimmedPathname = pathname.replace("/", "")
          const tabIndex = scenes[0].tabs.findIndex(
            (tab) => tab.tabName.toLowerCase() === trimmedPathname
          )

          navigate(route)
          if (route === "/") {
            setCurrentTabIndex(tabIndex === -1 ? 0 : tabIndex)
          }
        }
      }
      window.addEventListener("keydown", handleKeyPress)

      return () => {
        window.removeEventListener("keydown", handleKeyPress)
        if (!isCanvasTabMode) setHoverText(null)
      }
    } else {
      setHover(false)
      if (!isCanvasTabMode) setHoverText(null)
    }
  }, [
    isCanvasTabMode,
    currentScene,
    currentTabIndex,
    node,
    hoverName,
    navigate,
    route,
    scenes,
    pathname,
    setCurrentTabIndex,
    currentScene?.tabs,
    router,
    setHoverText
  ])

  const handlePointerEnter = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return
      setHover(true)
      router.prefetch(route)
      setCursorType("click")
      setHoverText(hoverName)
    },
    [activeRoute, route, hoverName]
  )

  const handlePointerLeave = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return
      setHover(false)
      setHoverText(null)
      setCursorType("default")
    },
    [activeRoute]
  )

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return
      navigate(route)
      setCursorType("default")
      setCurrentTabIndex(-1)
    },
    [activeRoute, navigate, route, setCurrentTabIndex]
  )

  const meshProps = useMemo(
    () => ({
      position: [node.position.x, node.position.y, node.position.z] as [
        number,
        number,
        number
      ],
      rotation: node.rotation
    }),
    [node.position.x, node.position.y, node.position.z, node.rotation]
  )

  return (
    <>
      <group
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <mesh
          ref={meshRef}
          geometry={node.geometry}
          position={meshProps.position}
          rotation={meshProps.rotation}
        >
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      <RoutingPlane
        visible={hover}
        position={meshProps.position}
        scale={[1, 1]}
        rotation={[
          meshProps.rotation.x,
          meshProps.rotation.y,
          meshProps.rotation.z
        ]}
        geometry={node.geometry}
      />
    </>
  )
}
