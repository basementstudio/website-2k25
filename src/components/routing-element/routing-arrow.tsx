import { useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import type { Mesh } from "three"
import { abs, floor, Fn, mod, step, uv, vec2, vec4 } from "three/tsl"
import { MeshBasicNodeMaterial } from "three/webgpu"

import { useFrameCallback } from "@/hooks/use-pausable-time"
import { fragmentBindings } from "@/lib/graphics/material"

export const RoutingArrow = ({
  position,
  rotation,
  scale
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale: number
}) => {
  const material = useMemo(() => {
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      side: 2,
      depthWrite: false,
      depthTest: false
    })
    material.fragmentNode = Fn(() => {
      const grid = floor(uv().mul(vec2(12, 18)))
        .div(vec2(12, 18))
        .mul(2)
        .sub(1)
      const triangle = step(abs(grid.x).mul(2).sub(0.9), grid.y).mul(
        step(grid.y, 0.9)
      )
      const cell = floor(fragmentBindings.gl_FragCoord.xy.mul(0.5))
      mod(cell.x.add(cell.y), 2).lessThan(0.5).or(triangle.equal(0)).discard()
      return vec4(1)
    })()
    return material
  }, [])
  useEffect(() => () => material.dispose(), [material])
  const meshRef = useRef<Mesh | null>(null)
  const camera = useThree((state) => state.camera)

  useFrameCallback((_, __, elapsedTime) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion)
      meshRef.current.rotateZ(rotation?.[2] ?? 0)
      const offset = Math.sin(elapsedTime * 3.5) * 0.03

      if (rotation?.[2] === -1.5708) {
        meshRef.current.position.x = (position?.[0] ?? 0) + offset
      } else {
        meshRef.current.position.y = (position?.[1] ?? 0) + offset
      }
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={1}
    >
      <planeGeometry args={[0.16, 0.24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
