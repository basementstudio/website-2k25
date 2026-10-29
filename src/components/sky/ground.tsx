import { useEffect, useMemo } from "react"
import { ShaderMaterial } from "three"

import { outdoorTintUniform } from "@/shaders/material-global-shader"

import frag from "./ground-frag.glsl"
import vert from "./ground-vert.glsl"

export const ExteriorGround = ({
  skyMaterial
}: {
  skyMaterial: ShaderMaterial
}) => {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uSkyLut: skyMaterial.uniforms.uSkyLut,
          uOutdoorTint: outdoorTintUniform,
          fadeFactor: skyMaterial.uniforms.fadeFactor
        }
      }),
    [skyMaterial]
  )
  useEffect(() => () => material.dispose(), [material])

  // The authored street ends at x -40/9 and z 16. Keep its detail on top,
  // with continuous ground underneath for the plane's wide, moving camera.
  // Extend under the office too, so steep views cannot reveal a near edge.
  // Stay below the street's lowest (-0.18) point and the office floor.
  return (
    <mesh
      name="exterior-ground"
      position={[0, -0.2, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => null}
    >
      <planeGeometry args={[2000, 2000]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
