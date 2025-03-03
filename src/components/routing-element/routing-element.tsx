import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, ShaderMaterial } from "three"
import { memo } from "react"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

import fragmentShader from "./frag.glsl"
import vertexShader from "./vert.glsl"
import { useCursor } from "@/hooks/use-mouse"
import { RoutingPlus } from "./routing-plus"

interface RoutingElementProps {
  node: Mesh
  route: string
  hoverName: string
  groupName?: string
}

const routingMaterial = new ShaderMaterial({
  depthWrite: false,
  depthTest: false,
  transparent: true,
  uniforms: {
    resolution: { value: [window.innerWidth, window.innerHeight] }
  },
  fragmentShader: fragmentShader,
  vertexShader: vertexShader
})

const updateMaterialResolution = () => {
  routingMaterial.uniforms.resolution.value = [
    window.innerWidth,
    window.innerHeight
  ]
}

const RoutingElementComponent = ({
  node,
  route,
  hoverName,
  groupName
}: RoutingElementProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const setCursor = useCursor("default")

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
  const meshRef = useRef<Mesh | null>(null)

  const activeRoute = useMemo(
    () => pathname === route || selected,
    [pathname, route, selected]
  )

  const navigate = useCallback(
    (routePath: string) => {
      handleNavigation(`${!routePath.startsWith("/") ? "/" : ""}${routePath}`)
    },
    [handleNavigation]
  )

  const groupHoverHandlers = useMemo(() => {
    if (!groupName) return null

    return {
      dispatchGroupHover: (isHovering: boolean) => {
        window.dispatchEvent(
          new CustomEvent("group-hover", {
            detail: { groupName, hover: isHovering }
          })
        )
      },
      handleGroupHover: (e: CustomEvent) => {
        if (e.detail.groupName === groupName && e.detail.hover !== hover) {
          setHover(e.detail.hover)
          if (e.detail.hover) {
            router.prefetch(route)
            setCursor("pointer", hoverName)
          } else {
            setCursor("default", null)
          }
        }
      }
    }
  }, [groupName, hover, route, hoverName, router])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [
      navigate,
      pathname,
      route,
      scenes,
      setCurrentTabIndex,
      setEnteredByKeyboard
    ]
  )

  const handlePointerEnter = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return

      setHover(true)
      setCursor("pointer", hoverName)
      router.prefetch(route)

      groupHoverHandlers?.dispatchGroupHover(true)
    },
    [activeRoute, groupHoverHandlers, hoverName, route, router]
  )

  const handlePointerLeave = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return

      setHover(false)

      setCursor("default", null)

      groupHoverHandlers?.dispatchGroupHover(false)
    },
    [activeRoute, groupHoverHandlers]
  )

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation()
      if (activeRoute) return

      setEnteredByKeyboard(false)
      navigate(route)
      setCursor("default")
      setCurrentTabIndex(-1)
    },
    [activeRoute, navigate, route, setCurrentTabIndex, setEnteredByKeyboard]
  )

  useEffect(() => {
    if (activeRoute) setHover(false)
    if (!isCanvasTabMode || !currentScene?.tabs) {
      setHover(false)
      setCursor("default", null)
      return
    }

    const currentTab = currentScene.tabs[currentTabIndex]
    if (currentTab && currentTab.tabClickableName === node.name) {
      setHover(true)
      router.prefetch(route)
      setCursor("pointer", hoverName)

      window.addEventListener("keydown", handleKeyPress)
      return () => {
        window.removeEventListener("keydown", handleKeyPress)
        setCursor("default", null)
      }
    } else {
      setHover(false)
      setCursor("default", null)
    }
  }, [
    activeRoute,
    isCanvasTabMode,
    currentScene?.tabs,
    currentTabIndex,
    node.name,
    hoverName,
    route,
    router,

    handleKeyPress
  ])

  useEffect(() => {
    if (!groupName || !groupHoverHandlers) return

    window.addEventListener(
      "group-hover" as any,
      groupHoverHandlers.handleGroupHover
    )
    return () =>
      window.removeEventListener(
        "group-hover" as any,
        groupHoverHandlers.handleGroupHover
      )
  }, [groupName, groupHoverHandlers])

  useEffect(() => {
    updateMaterialResolution()
  }, [])

  return (
    <>
      <group
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        position={[node.position.x, node.position.y, node.position.z]}
        rotation={node.rotation}
        visible={hover}
      >
        <mesh
          ref={meshRef}
          geometry={node.geometry}
          renderOrder={1}
          material={routingMaterial}
        />
      </group>
      <group
        position={[node.position.x, node.position.y, node.position.z]}
        rotation={node.rotation}
        visible={hover && !groupName}
      >
        <RoutingPlus geometry={node.geometry} />
      </group>
    </>
  )
}

export const RoutingElement = memo(RoutingElementComponent)
