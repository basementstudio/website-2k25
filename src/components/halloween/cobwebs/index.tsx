import { useMemo } from "react"
import {
  DoubleSide,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  Vector3
} from "three"

import { COBWEBS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { lightFlickerUniform } from "@/shaders/material-global-shader"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

// Clear of the wall so the web never z-fights with it.
const WALL_OFFSET = 0.015

export const HalloweenCobwebs = () => {
  // A unit quad whose (0, 0) corner is the web's anchor in the room's corner.
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1)
    plane.translate(0.5, 0.5, 0)
    return plane
  }, [])
  const materials = useMemo(
    () =>
      COBWEBS.map(
        (web) =>
          new ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
              uTime: { value: 0 },
              uSeed: { value: web.seed },
              uOpacity: { value: 1 }
            },
            transparent: true,
            depthWrite: false,
            side: DoubleSide
          })
      ),
    []
  )
  const transforms = useMemo(
    () =>
      COBWEBS.map((web) => {
        const u = new Vector3(...web.u).normalize()
        const v = new Vector3(...web.v).normalize()
        const normal = new Vector3(...web.normal).normalize()
        const matrix = new Matrix4().makeBasis(
          u.multiplyScalar(web.size),
          v.multiplyScalar(web.size),
          normal
        )
        matrix.setPosition(
          new Vector3(...web.corner).addScaledVector(normal, WALL_OFFSET)
        )
        return matrix
      }),
    []
  )

  useFrameCallback((_, __, time) => {
    // Threads catch less light in a blackout.
    const opacity = 0.35 + 0.65 * lightFlickerUniform.value
    for (const material of materials) {
      material.uniforms.uTime.value = time
      material.uniforms.uOpacity.value = opacity
    }
  })

  return (
    <>
      {COBWEBS.map((web, index) => (
        <mesh
          key={web.seed}
          geometry={geometry}
          material={materials[index]}
          matrix={transforms[index]}
          matrixAutoUpdate={false}
          raycast={() => null}
          frustumCulled={false}
        />
      ))}
    </>
  )
}
