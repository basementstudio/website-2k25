import { ThreeEvent } from "@react-three/fiber"
import { useMemo } from "react"
import { useCallback } from "react"
import * as THREE from "three"

export type LerpedMouse = ReturnType<typeof useLerpMouse>[2]

interface LerpMouseParams {
  lerpSpeed?: number
}

export function useLerpMouse({ lerpSpeed = 1 }: LerpMouseParams = {}) {
  const vRefs = useMemo(
    () => ({
      uv: new THREE.Vector2(),
      smoothUv: new THREE.Vector2(),
      prevSmoothUv: new THREE.Vector2(),
      velocity: new THREE.Vector2(),
      shouldReset: true,
      point: new THREE.Vector3(),
      prevPoint: new THREE.Vector3(),
      pointSpeed: new THREE.Vector3(),
      depth: 0
    }),
    []
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.pointer) {
        vRefs.uv.copy(e.pointer)
        vRefs.point.copy(e.point)
      }

      vRefs.depth = e.distance
    },
    [vRefs]
  )

  const lerpMouse = useCallback(
    (delta: number) => {
      if (vRefs.shouldReset) {
        vRefs.smoothUv.copy(vRefs.uv)
        vRefs.prevSmoothUv.copy(vRefs.uv)
        vRefs.point.copy(vRefs.point)
        vRefs.prevPoint.copy(vRefs.point)
        vRefs.shouldReset = false
      }

      vRefs.prevSmoothUv.copy(vRefs.smoothUv)

      const l = Math.min(delta * 10 * lerpSpeed, 1)
      vRefs.smoothUv.lerp(vRefs.uv, l)
      vRefs.velocity.subVectors(vRefs.smoothUv, vRefs.prevSmoothUv)

      // 3D point
      vRefs.pointSpeed.copy(vRefs.point).sub(vRefs.prevPoint)
      vRefs.prevPoint.copy(vRefs.point)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vRefs]
  )

  return [handlePointerMove, lerpMouse, vRefs] as const
}
