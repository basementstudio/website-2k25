import { useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef } from "react"
import {
  BufferGeometry,
  InstancedMesh as InstancedMeshType,
  Object3D,
  PlaneGeometry,
  Vector4
} from "three"
import { NodeMaterial } from "three/webgpu"
import {
  cross,
  Discard,
  Fn,
  float,
  positionLocal,
  uniform,
  uv,
  vec3,
  vec4
} from "three/tsl"

import { useFrameCallback } from "@/hooks/use-pausable-time"

const POINT_SIZE = 0.04

const RoutingPlusInner = ({ geometry }: { geometry: BufferGeometry }) => {
  const meshRef = useRef<InstancedMeshType>(null)
  const camera = useThree((state) => state.camera)

  const { planeGeo, material, count, positionsArray, uCamQ } = useMemo(() => {
    if (!geometry.attributes.position || !geometry.attributes.normal)
      return { planeGeo: null, material: null, count: 0, positionsArray: null, uCamQ: null }

    const count = geometry.attributes.position.count
    const positionsArray = geometry.attributes.position.array as Float32Array

    const planeGeo = new PlaneGeometry(POINT_SIZE, POINT_SIZE)

    const uCamQ = uniform(new Vector4(0, 0, 0, 1))

    const mat = new NodeMaterial()
    mat.depthTest = false
    mat.depthWrite = false
    mat.transparent = true

    // GPU billboard: rotate local vertex by camera quaternion
    // Quaternion rotation: v' = v + 2w(q × v) + 2(q × (q × v))
    const qVec = vec3(uCamQ.x, uCamQ.y, uCamQ.z)
    const c1 = cross(qVec, positionLocal)
    const c2 = cross(qVec, c1)
    mat.positionNode = positionLocal
      .add(c1.mul(uCamQ.w).mul(2.0))
      .add(c2.mul(2.0))

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

    return { planeGeo, material: mat, count, positionsArray, uCamQ }
  }, [geometry])

  // Set instance positions once (billboard rotation handled by GPU)
  useEffect(() => {
    if (!meshRef.current || !positionsArray) return

    const dummy = new Object3D()
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positionsArray[i * 3],
        positionsArray[i * 3 + 1],
        positionsArray[i * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, positionsArray])

  // Single uniform update per frame — O(1) instead of O(n) matrix loop
  useFrameCallback(() => {
    if (!uCamQ) return
    const q = camera.quaternion
    uCamQ.value.set(q.x, q.y, q.z, q.w)
  })

  if (!planeGeo || !material || count === 0) return null

  return <instancedMesh ref={meshRef} args={[planeGeo, material, count]} />
}

export const RoutingPlus = memo(RoutingPlusInner)
