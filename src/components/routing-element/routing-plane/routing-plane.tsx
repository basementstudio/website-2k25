import { PlaneGeometry, ShaderMaterial } from "three"
import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const RoutingPlane = ({
  position,
  size,
  rotation
}: {
  position: [number, number, number]
  size: [number, number]
  rotation: [number, number, number]
}) => {
  const material = new ShaderMaterial({
    uniforms: {
      thickness: {
        value: 1.0
      },
      planeSize: {
        value: size
      }
    },
    depthTest: false,
    transparent: true,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  })

  const geo = new PlaneGeometry(size[0], size[1])

  return (
    <mesh
      geometry={geo}
      material={material}
      rotation={rotation}
      position={position}
    />
  )
}
