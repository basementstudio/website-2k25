import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

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
          visible={hover}
        >
          <shaderMaterial
            depthWrite={false}
            depthTest={false}
            fragmentShader={`
              varying vec2 vUv;
              varying vec4 vPos;
              uniform vec2 resolution;
              
              void main() {
                // Define a fixed border thickness in pixels
                float borderThickness = 1.5;
                
                // Calculate the distance from each edge in screen space
                // First, calculate derivatives to get pixel-sized measurements
                vec2 dwdx = dFdx(vUv);
                vec2 dwdy = dFdy(vUv);
                float pixelWidth = sqrt(dwdx.x * dwdx.x + dwdy.x * dwdy.x);
                float pixelHeight = sqrt(dwdx.y * dwdx.y + dwdy.y * dwdy.y);
                
                // Convert border thickness to UV space based on pixel size
                vec2 uvBorderSize = vec2(
                  borderThickness * pixelWidth,
                  borderThickness * pixelHeight
                );
                
                // Calculate distance from each edge in normalized space
                vec2 distFromEdge = min(vUv, 1.0 - vUv);
                
                // Check if we're within the border
                bool isBorder = 
                  distFromEdge.x < uvBorderSize.x || 
                  distFromEdge.y < uvBorderSize.y;
                
                // Calculate diagonal pattern based on screen position
                vec2 vCoords = vPos.xy;
                vCoords /= vPos.w;
                vCoords = vCoords * 0.5 + 0.5;
                
                // Apply aspect ratio correction
                float aspectRatio = resolution.x / resolution.y;
                vCoords.x *= aspectRatio;
                
                // Diagonal pattern parameters
                float lineSpacing = 0.01;
                float lineWidth = 0.15;
                float lineOpacity = 0.15;
                
                // Calculate diagonal pattern
                float diagonal = (vCoords.x - vCoords.y) / lineSpacing;
                float pattern = abs(fract(diagonal) - 0.5) * 2.0;
                float line = smoothstep(1.0 - lineWidth, 1.0, 1.0 - pattern);
                
                // Final color: combine border and diagonals
                if (isBorder) {
                  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.2); // White color for border
                } else {
                  gl_FragColor = vec4(vec3(1.0), line * lineOpacity); // Diagonal pattern inside
                }
              }
            `}
            vertexShader={`
              varying vec2 vUv;
              varying vec4 vPos;
              
              void main() {
                vUv = uv;
                vPos = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
                gl_Position = vPos;
              }
            `}
            transparent={true}
            uniforms={{
              resolution: { value: [window.innerWidth, window.innerHeight] }
            }}
          />
        </mesh>
      </group>
    </>
  )
}
