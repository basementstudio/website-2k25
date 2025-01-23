import {
  BufferGeometry,
  ShaderMaterial,
  MeshBasicMaterial,
  BoxGeometry
} from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const RoutingPlane = ({
  position,
  rotation,
  geometry,
  scale
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  geometry: BufferGeometry
  scale: [number, number]
}) => {
  const material = new ShaderMaterial({
    uniforms: {
      thickness: {
        value: 1.0
      }
    },
    depthTest: false,
    transparent: true,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  })

  const squareSize = 0.03
  const squareGeometry = new BoxGeometry(squareSize, squareSize, 0.01)
  const squareMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    depthWrite: false,
    depthTest: false
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        material={material}
        scale={[scale[0], scale[1], 1]}
      />
      {/* Add squares at each vertex of the geometry */}
      {geometry.attributes.position
        ? Array.from({ length: geometry.attributes.position.count }).map(
            (_, i) => {
              const x = geometry.attributes.position.array[i * 3]
              const y = geometry.attributes.position.array[i * 3 + 1]
              const z = geometry.attributes.position.array[i * 3 + 2]

              return (
                <mesh
                  key={`square-${i}`}
                  geometry={squareGeometry}
                  material={squareMaterial}
                  position={[x * scale[0], y * scale[1], z]}
                  scale={[1 / scale[0], 1 / scale[1], 1]}
                />
              )
            }
          )
        : null}
    </group>
  )
}
