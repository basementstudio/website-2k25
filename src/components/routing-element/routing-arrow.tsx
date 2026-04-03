import { useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { DoubleSide, type Mesh } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Discard,
  Fn,
  float,
  floor,
  mod,
  screenCoordinate,
  step,
  uv,
  vec2,
  vec4
} from "three/tsl"

import { useFrameCallback } from "@/hooks/use-pausable-time"

export const RoutingArrow = ({
  position,
  rotation,
  scale
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale: number
}) => {
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

  const material = useMemo(() => {
    const mat = new NodeMaterial()
    mat.transparent = true
    mat.side = DoubleSide
    mat.depthWrite = false
    mat.depthTest = false

    const pixelDensity = float(12.0)
    const gridSize = vec2(pixelDensity, pixelDensity.mul(1.5))
    const grid = floor(uv().mul(gridSize))
    const gridUv = grid.div(gridSize)

    const p = gridUv.mul(2.0).sub(1.0)
    const triangle = float(step(p.x.abs().mul(2.0).sub(0.9), p.y)).mul(
      float(step(p.y, float(0.9)))
    )

    const checkerPos = floor(screenCoordinate.xy.mul(0.5))
    const checker = mod(checkerPos.x.add(checkerPos.y), float(2.0))

    const shouldDiscard = checker.lessThan(0.5).or(triangle.equal(0.0))

    mat.colorNode = Fn(() => {
      Discard(shouldDiscard)
      return vec4(1.0, 1.0, 1.0, 1.0)
    })()

    return mat
  }, [])

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
