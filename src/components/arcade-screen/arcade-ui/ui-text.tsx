import { memo, useMemo, useRef } from "react"
import { Color } from "three"

import { createTextMaterial } from "@/shaders/material-arcade-text"

import { buildTextGeometry, measureText, useMsdfFont } from "./msdf-font"

interface UITextProps {
  text: string
  fontSize: number
  color?: string
  position?: [number, number, number]
  anchorX?: "left" | "center" | "right"
  opacity?: number
  renderOrder?: number
}

export const UIText = memo(function UIText({
  text,
  fontSize,
  color = "#FF4D00",
  position = [0, 0, 0],
  anchorX = "left",
  opacity = 1,
  renderOrder = 0
}: UITextProps) {
  const font = useMsdfFont()

  const { material, uniforms } = useMemo(
    () =>
      createTextMaterial({
        atlas: font.atlas,
        color: new Color(color),
        opacity
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [font.atlas]
  )

  // Update color/opacity without recreating material
  const prevRef = useRef({ color, opacity })
  if (prevRef.current.color !== color || prevRef.current.opacity !== opacity) {
    prevRef.current = { color, opacity }
    uniforms.uColor.value.set(
      ...new Color(color).toArray() as [number, number, number]
    )
    uniforms.uOpacity.value = opacity
  }

  const geometry = useMemo(
    () => buildTextGeometry(text, fontSize, font),
    [text, fontSize, font]
  )

  // Compute anchor offset
  const offsetX = useMemo(() => {
    if (anchorX === "left") return 0
    const w = measureText(text, fontSize, font)
    return anchorX === "center" ? -w / 2 : -w
  }, [text, fontSize, font, anchorX])

  return (
    <mesh
      position={[position[0] + offsetX, position[1], position[2]]}
      geometry={geometry}
      renderOrder={renderOrder}
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
})
