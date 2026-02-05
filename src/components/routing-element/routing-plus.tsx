import { useThree } from "@react-three/fiber"
import { memo, useMemo, useRef } from "react"
import {
  BufferGeometry,
  InstancedMesh as InstancedMeshType,
  Object3D,
  PlaneGeometry
} from "three"
import { NodeMaterial } from "three/webgpu"
import { Discard, Fn, float, uv, vec4 } from "three/tsl"

import { useFrameCallback } from "@/hooks/use-pausable-time"

const POINT_SIZE = 0.04
const dummy = new Object3D()

const RoutingPlusInner = ({ geometry }: { geometry: BufferGeometry }) => {
  const meshRef = useRef<InstancedMeshType>(null)
  const camera = useThree((state) => state.camera)

  const { planeGeo, material, count, positionsArray } = useMemo(() => {
    if (!geometry.attributes.position || !geometry.attributes.normal)
      return { planeGeo: null, material: null, count: 0, positionsArray: null }

    const count = geometry.attributes.position.count
    const positionsArray = geometry.attributes.position.array as Float32Array

    const planeGeo = new PlaneGeometry(POINT_SIZE, POINT_SIZE)

    const mat = new NodeMaterial()
    mat.depthTest = false
    mat.depthWrite = false
    mat.transparent = true

    // Cross/plus pattern using UVs (replaces gl_PointCoord)
    const coord = uv().mul(2.0).sub(1.0)
    const thickness = float(0.25)
    const isCross = coord.x
      .abs()
      .lessThan(thickness)
      .or(coord.y.abs().lessThan(thickness))

    mat.colorNode = Fn(() => {
      Discard(isCross.not())
      return vec4(1.0, 1.0, 1.0, 1.0)
    })()

    return { planeGeo, material: mat, count, positionsArray }
  }, [geometry])

  // Billboard each instance to face the camera (points are always screen-facing)
  useFrameCallback(() => {
    if (!meshRef.current || !positionsArray) return

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positionsArray[i * 3],
        positionsArray[i * 3 + 1],
        positionsArray[i * 3 + 2]
      )
      dummy.quaternion.copy(camera.quaternion)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!planeGeo || !material || count === 0) return null

  return <instancedMesh ref={meshRef} args={[planeGeo, material, count]} />
}

export const RoutingPlus = memo(RoutingPlusInner)
