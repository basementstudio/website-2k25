import { useTexture } from "@react-three/drei"
import { memo, useEffect, useMemo, useRef } from "react"

import { createImageMaterial } from "@/shaders/material-arcade-image"

interface UIImageProps {
  src: string
  width: number
  height: number
  position?: [number, number, number]
  opacity?: number
  renderOrder?: number
}

export const UIImage = memo(function UIImage({
  src,
  width,
  height,
  position = [0, 0, 0],
  opacity = 1,
  renderOrder = 0
}: UIImageProps) {
  const tex = useTexture(src)

  const { material, uniforms } = useMemo(
    () =>
      createImageMaterial({
        map: tex,
        opacity,
        imageAspect: tex.image ? tex.image.width / tex.image.height : 1,
        containerAspect: width / height
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Track src changes
  const prevSrc = useRef(src)
  useEffect(() => {
    if (prevSrc.current !== src) {
      prevSrc.current = src
    }
    uniforms.uMap.value = tex
    if (tex.image) {
      uniforms.uImageAspect.value = tex.image.width / tex.image.height
    }
    uniforms.uContainerAspect.value = width / height
    uniforms.uOpacity.value = opacity
  }, [tex, width, height, opacity, uniforms, src])

  return (
    <mesh
      position={[position[0] + width / 2, position[1] - height / 2, position[2]]}
      scale={[width, height, 1]}
      renderOrder={renderOrder}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
})
