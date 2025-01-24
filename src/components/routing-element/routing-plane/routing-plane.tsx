import {
  BufferGeometry,
  ShaderMaterial,
  MeshBasicMaterial,
  BoxGeometry,
  Matrix4,
  Object3D,
  PlaneGeometry
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
  const squareGeometry = new PlaneGeometry(squareSize, squareSize)
  const squareMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    depthWrite: false,
    depthTest: false
  })

  const instancedSquares = geometry.attributes.position ? (
    <instancedMesh
      args={[
        squareGeometry,
        squareMaterial,
        geometry.attributes.position.count
      ]}
      position={[0, 0, 0]}
      ref={(mesh) => {
        if (mesh && geometry.attributes.position) {
          const dummy = new Object3D()
          const matrix = new Matrix4()

          for (let i = 0; i < geometry.attributes.position.count; i++) {
            const x = geometry.attributes.position.array[i * 3] * scale[0]
            const y = geometry.attributes.position.array[i * 3 + 1] * scale[1]
            const z = geometry.attributes.position.array[i * 3 + 2]

            dummy.position.set(x, y, z)
            dummy.scale.set(1 / scale[0], 1 / scale[1], 1)
            dummy.updateMatrix()

            matrix.copy(dummy.matrix)
            mesh.setMatrixAt(i, matrix)
          }
          mesh.instanceMatrix.needsUpdate = true
        }
      }}
    />
  ) : null

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        material={material}
        scale={[scale[0], scale[1], 1]}
      />
      {instancedSquares}
    </group>
  )
}
