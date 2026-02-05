import { useMotionValue, useMotionValueEvent } from "motion/react"
import { animate } from "motion/react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { memo } from "react"
import { Mesh } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec3,
  uniform,
  uv,
  dFdx,
  dFdy,
  sqrt,
  min,
  max,
  step,
  smoothstep,
  fract,
  mix,
  screenUV,
  viewportSize
} from "three/tsl"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useCursor } from "@/hooks/use-mouse"

import { valueRemap } from "../arcade-game/lib/math"
import { RoutingPlus } from "./routing-plus"

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
  const { routingMaterial, routingUniforms } = useMemo(() => {
    const uOpacity = uniform(0)
    const uBorderPadding = uniform(0)

    const material = new NodeMaterial()
    material.depthWrite = false
    material.depthTest = false
    material.transparent = true

    material.colorNode = vec3(1.0, 1.0, 1.0)

    material.opacityNode = Fn(() => {
      const vUv = uv()

      // Border detection using UV derivatives
      const dwdx = dFdx(vUv)
      const dwdy = dFdy(vUv)
      const pixelWidth = sqrt(dwdx.x.mul(dwdx.x).add(dwdy.x.mul(dwdy.x)))
      const pixelHeight = sqrt(dwdx.y.mul(dwdx.y).add(dwdy.y.mul(dwdy.y)))

      const borderThickness = float(1.3).add(uBorderPadding)
      const uvBorderSizeX = borderThickness.mul(pixelWidth)
      const uvBorderSizeY = borderThickness.mul(pixelHeight)
      const uvBorderPaddingX = uBorderPadding.mul(pixelWidth)
      const uvBorderPaddingY = uBorderPadding.mul(pixelHeight)

      const distFromEdgeX = min(vUv.x, float(1.0).sub(vUv.x))
      const distFromEdgeY = min(vUv.y, float(1.0).sub(vUv.y))

      // isPadding: near-edge within padding distance (0/1)
      const isPadding = max(
        float(1.0).sub(step(uvBorderPaddingX, distFromEdgeX)),
        float(1.0).sub(step(uvBorderPaddingY, distFromEdgeY))
      )

      // isBorder: within border region (0/1)
      const isBorder = max(
        float(1.0).sub(step(uvBorderSizeX, distFromEdgeX)),
        float(1.0).sub(step(uvBorderSizeY, distFromEdgeY))
      )

      // Diagonal line pattern using screen coordinates
      const vCoords = screenUV.toVar()
      const aspectRatio = viewportSize.x.div(viewportSize.y)
      vCoords.x.mulAssign(aspectRatio)

      const lineSpacing = 0.006
      const lineThickness = 0.2
      const lineOpacity = 0.15

      const diagonal = vCoords.x
        .sub(vCoords.y)
        .div(float(lineSpacing).mul(sqrt(float(2.0))))
      const halfWidth = float(lineThickness).mul(0.5)
      const fractDiag = fract(diagonal)
      const pattern = smoothstep(float(0.5).sub(halfWidth), float(0.5), fractDiag)
        .sub(smoothstep(float(0.5), float(0.5).add(halfWidth), fractDiag))

      // Discard padding area
      isPadding.greaterThan(0.5).discard()

      // Border: 0.2 * opacity, Interior: pattern * lineOpacity * opacity
      const borderAlpha = float(0.2).mul(uOpacity)
      const interiorAlpha = pattern.mul(lineOpacity).mul(uOpacity)

      return mix(interiorAlpha, borderAlpha, isBorder)
    })()

    return {
      routingMaterial: material,
      routingUniforms: {
        opacity: uOpacity,
        borderPadding: uBorderPadding
      }
    }
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

  const outlinesRef = useRef<Mesh>(null)
  const crossRef = useRef<Mesh>(null)

  const visibility = useMotionValue(0)

  useEffect(() => {
    const animation = animate(visibility, hover ? 1 : 0, {
      duration: 0.16,
      ease: "circOut"
    })

    return () => animation.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover])

  useMotionValueEvent(visibility, "change", (v) => {
    const outlines = meshRef.current
    const cross = crossRef.current
    if (!outlines || !cross) return

    const s = valueRemap(v, 0, 1, 10, 0)
    routingUniforms.borderPadding.value = s
    routingUniforms.opacity.value = v
  })

  return (
    <>
      <group
        ref={outlinesRef}
        onPointerEnter={(e) => {
          e.stopPropagation()
          handlePointerEnter(e)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          handlePointerLeave(e)
        }}
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
