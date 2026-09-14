import { memo, useEffect, useMemo } from "react"
import { BufferGeometry } from "three"
import { abs, Fn, uv, vec4 } from "three/tsl"

import { createBillboards } from "@/lib/graphics/billboards"

export const RoutingPlus = memo(
  ({ geometry }: { geometry: BufferGeometry }) => {
    const { mesh, material } = useMemo(() => {
      const result = createBillboards(
        new Float32Array(geometry.attributes.position.array),
        8
      )
      result.material.depthTest = false
      result.material.fragmentNode = Fn(() => {
        const p = abs(uv().mul(2).sub(1))
        p.x.greaterThanEqual(0.25).and(p.y.greaterThanEqual(0.25)).discard()
        return vec4(1)
      })()
      return result
    }, [geometry])
    useEffect(
      () => () => {
        mesh.geometry.dispose()
        material.dispose()
      },
      [mesh, material]
    )
    return <primitive object={mesh} />
  }
)
RoutingPlus.displayName = "RoutingPlus"
