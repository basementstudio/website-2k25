import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

import { RoutingPlane } from "./routing-plane/routing-plane"

interface RoutingElementProps {
  node: Mesh
  route: string
  hoverName: string
  groupName?: string
}

export const RoutingElement = ({
  node,
  route,
  hoverName,
  groupName
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
    setCurrentTabIndex,
    setEnteredByKeyboard
  } = useNavigationStore()
  const { handleNavigation } = useHandleNavigation()
  const { selected } = useInspectable()

  const [hover, setHover] = useState(false)

  const activeRoute = useMemo(() => {
    return pathname === route || selected
  }, [pathname, route, selected])

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

          setEnteredByKeyboard(true)
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
    setHoverText,
    setEnteredByKeyboard
  ])

  useEffect(() => {
    if (!groupName) return

    const handleGroupHover = (e: CustomEvent) => {
      if (e.detail.groupName === groupName && e.detail.hover !== hover) {
        setHover(e.detail.hover)
        if (e.detail.hover) {
          router.prefetch(route)
          setCursorType("click")
          setHoverText(hoverName)
        } else {
          setHoverText(null)
          setCursorType("default")
        }
      }
    }

    window.addEventListener("group-hover" as any, handleGroupHover)
    return () =>
      window.removeEventListener("group-hover" as any, handleGroupHover)
  }, [groupName, hover, route, hoverName, router, setCursorType, setHoverText])

  const handlePointerEnter = (e: any) => {
    e.stopPropagation()
    if (activeRoute) return

    setHover(true)
    router.prefetch(route)
    setCursorType("click")
    setHoverText(hoverName)

    if (groupName) {
      window.dispatchEvent(
        new CustomEvent("group-hover", {
          detail: { groupName, hover: true }
        })
      )
    }
  }

  const handlePointerLeave = (e: any) => {
    e.stopPropagation()
    if (activeRoute) return

    setHover(false)
    setHoverText(null)
    setCursorType("default")

    if (groupName) {
      window.dispatchEvent(
        new CustomEvent("group-hover", {
          detail: { groupName, hover: false }
        })
      )
    }
  }

  return (
    <>
      <group
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={(e) => {
          e.stopPropagation()
          if (activeRoute) return
          setEnteredByKeyboard(false)
          navigate(route)
          setCursorType("default")
          setCurrentTabIndex(-1)
        }}
      >
        <mesh
          ref={meshRef}
          geometry={node.geometry}
          position={[node.position.x, node.position.y, node.position.z]}
          rotation={node.rotation}
          renderOrder={1}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <RoutingPlane
        position={[node.position.x, node.position.y, node.position.z]}
        scale={[1, 1]}
        rotation={[node.rotation.x, node.rotation.y, node.rotation.z]}
        geometry={node.geometry}
        visible={hover}
        groupName={groupName}
      />
    </>
  )
}
