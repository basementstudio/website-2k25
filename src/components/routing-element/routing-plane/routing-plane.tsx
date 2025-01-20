import { PlaneGeometry, ShaderMaterial } from "three"
import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const RoutingPlane = ({
  position = [2.12, 3.57, -12.68] as [number, number, number],
  size = [3.3, 2.43] as [number, number],
  rotation = [0, Math.PI / 2, 0] as [number, number, number]
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
