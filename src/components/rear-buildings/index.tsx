import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { InstancedMesh, Object3D, ShaderMaterial } from "three"

import { outdoorTintUniform } from "@/shaders/material-global-shader"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

// Neighbouring blocks beyond the rear facade (z about -30). Their sides
// and roofs also exist, so the wide flight camera cannot reveal a card edge.
const BUILDINGS = [
  { x: -65, z: -88, height: 13.8 },
  { x: -40, z: -84, height: 17.2 },
  { x: -15, z: -90, height: 15.1 },
  { x: 10, z: -86, height: 12.6 },
  { x: 35, z: -92, height: 16.4 },
  { x: 60, z: -88, height: 14.4 }
]

export const RearBuildings = ({
  skyMaterial
}: {
  skyMaterial: ShaderMaterial
}) => {
  const mesh = useRef<InstancedMesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uOutdoorTint: outdoorTintUniform,
          uSkyLut: skyMaterial.uniforms.uSkyLut,
          fadeFactor: skyMaterial.uniforms.fadeFactor
        }
      }),
    [skyMaterial]
  )

  useLayoutEffect(() => {
    if (!mesh.current) return
    const transform = new Object3D()
    BUILDINGS.forEach(({ x, z, height }, i) => {
      transform.position.set(x, height / 2 - 0.2, z)
      transform.scale.set(28, height, 14)
      transform.updateMatrix()
      mesh.current!.setMatrixAt(i, transform.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [])

  useEffect(() => () => material.dispose(), [material])

  return (
    <instancedMesh
      name="rear-neighbouring-buildings"
      ref={mesh}
      args={[undefined, undefined, BUILDINGS.length]}
      raycast={() => null}
    >
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}
