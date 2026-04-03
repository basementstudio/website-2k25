import { memo, useMemo, useRef } from "react"
import { Color, Vector2 } from "three"

import { createPanelMaterial } from "@/shaders/material-arcade-panel"

// Three.js Color doesn't understand "transparent" — treat it as black
// (panels sit on a black background, so black = visually transparent)
const toColor = (c: string) => new Color(c === "transparent" ? "#000000" : c)

interface UIPanelProps {
  width: number
  height: number
  position?: [number, number, number]
  bgColor?: string
  borderColor?: string
  borderWidth?: number
  radius?: number
  opacity?: number
  renderOrder?: number
  onClick?: (e: any) => void
  onPointerOver?: (e: any) => void
  onPointerOut?: (e: any) => void
  children?: React.ReactNode
}

export const UIPanel = memo(function UIPanel({
  width,
  height,
  position = [0, 0, 0],
  bgColor = "#000000",
  borderColor = "#FF4D00",
  borderWidth = 0,
  radius = 0,
  opacity = 1,
  renderOrder = 0,
  onClick,
  onPointerOver,
  onPointerOut,
  children
}: UIPanelProps) {
  const { material, uniforms } = useMemo(
    () =>
      createPanelMaterial({
        bgColor: toColor(bgColor),
        borderColor: toColor(borderColor),
        borderWidth,
        radius,
        size: new Vector2(width, height),
        opacity
      }),
    // Only recreate material on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Update uniforms reactively without recreating material
  const prevRef = useRef({ bgColor, borderColor, borderWidth, radius, opacity, width, height })
  if (
    prevRef.current.bgColor !== bgColor ||
    prevRef.current.borderColor !== borderColor ||
    prevRef.current.borderWidth !== borderWidth ||
    prevRef.current.radius !== radius ||
    prevRef.current.opacity !== opacity ||
    prevRef.current.width !== width ||
    prevRef.current.height !== height
  ) {
    prevRef.current = { bgColor, borderColor, borderWidth, radius, opacity, width, height }
    uniforms.uBgColor.value.set(
      ...toColor(bgColor).toArray() as [number, number, number]
    )
    uniforms.uBorderColor.value.set(
      ...toColor(borderColor).toArray() as [number, number, number]
    )
    uniforms.uBorderWidth.value = borderWidth
    uniforms.uRadius.value = radius
    uniforms.uSize.value.set(width, height)
    uniforms.uOpacity.value = opacity
  }

  return (
    <group position={position}>
      <mesh
        renderOrder={renderOrder}
        scale={[width, height, 1]}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
      {children && (
        <group position={[-width / 2, height / 2, 0.001]}>
          {children}
        </group>
      )}
    </group>
  )
})
