import { useMotionValue, useMotionValueEvent } from "motion/react"
import { animate } from "motion/react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { memo } from "react"
import { Mesh, ShaderMaterial } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useCursor } from "@/hooks/use-mouse"

import { valueRemap } from "../arcade-game/lib/math"
import fragmentShader from "./frag.glsl"
import { RoutingPlus } from "./routing-plus"
import vertexShader from "./vert.glsl"

interface RoutingElementProps {
  node: Mesh
  route: string
  hoverName: string
  groupName?: string
}

const RoutingElementComponent = ({
  node,
  route,
  hoverName,
  groupName
}: RoutingElementProps) => {
  const { routingMaterial, updateMaterialResolution } = useMemo(() => {
    const routingMaterial = new ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: true,
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
      uniforms: {
        resolution: { value: [] },
        opacity: { value: 0 },
        borderPadding: { value: 0 }
      }
    })

    // routingMaterial.customProgramCacheKey = () => "routing-element-material"

    const updateMaterialResolution = () => {
      routingMaterial.uniforms.resolution.value = [
        window.innerWidth,
        window.innerHeight
      ]
    }

    return { routingMaterial, updateMaterialResolution }
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      window.addEventListener("keydown", handleKeyPress, { passive: true })

      return () => {
        window.removeEventListener("keydown", handleKeyPress)
        setCursor("default", null)
      }
    } else {
      setHover(false)
      setCursor("default", null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const onResize = () => updateMaterialResolution()

    window.addEventListener("resize", onResize, { passive: true })

    onResize()

    return () => window.removeEventListener("resize", onResize)
  }, [])

  const outlinesRef = useRef<Mesh>(null)
  const crossRef = useRef<Mesh>(null)

  const visibility = useMotionValue(0)

  useEffect(() => {
    const animation = animate(visibility, hover ? 1 : 0, {
      duration: 0.16,
      ease: "circOut"
    })

    return () => animation.stop()
  }, [hover])

  useMotionValueEvent(visibility, "change", (v) => {
    const outlines = meshRef.current
    const cross = crossRef.current
    if (!outlines || !cross) return

    const s = valueRemap(v, 0, 1, 10, 0)
    routingMaterial.uniforms.borderPadding.value = s
    routingMaterial.uniforms.opacity.value = v
  })

  return (
    <>
      <group
        ref={outlinesRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        position={[node.position.x, node.position.y, node.position.z]}
        rotation={node.rotation}
        visible={true}
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
        ref={crossRef}
      >
        <RoutingPlus geometry={node.geometry} />
      </group>
    </>
  )
}

export const RoutingElement = memo(RoutingElementComponent)
