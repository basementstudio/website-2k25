import { useMemo } from "react"
import {
  BufferGeometry,
  ShaderMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3
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
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          thickness: {
            value: 1.0
          }
        },
        depthTest: false,
        transparent: true,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
      }),
    []
  )

  const squareMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          color: { value: [1.0, 1.0, 1.0] }
        },
        vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      varying vec2 vUv;
      void main() {
        float thickness = 0.2;
        float vertical = step(0.5 - thickness/2.0, vUv.x) * step(vUv.x, 0.5 + thickness/2.0);
        float horizontal = step(0.5 - thickness/2.0, vUv.y) * step(vUv.y, 0.5 + thickness/2.0);
        float plus = max(vertical, horizontal);
        gl_FragColor = vec4(vec3(1.0), plus);
      }
    `,
        transparent: true,
        depthTest: false
      }),
    []
  )

  const squareGeometry = useMemo(() => new PlaneGeometry(0.05, 0.05), [])

  const squares =
    geometry.attributes.position && geometry.attributes.normal ? (
      <>
        {Array.from({ length: geometry.attributes.position.count }).map(
          (_, i) => {
            const x = geometry.attributes.position.array[i * 3] * scale[0]
            const y = geometry.attributes.position.array[i * 3 + 1] * scale[1]
            const z = geometry.attributes.position.array[i * 3 + 2]

            const nx = geometry.attributes.normal.array[i * 3]
            const ny = geometry.attributes.normal.array[i * 3 + 1]
            const nz = geometry.attributes.normal.array[i * 3 + 2]

            const quaternion = new Quaternion().setFromUnitVectors(
              new Vector3(0, 0, 1),
              new Vector3(nx, ny, nz)
            )

            return (
              <mesh
                key={i}
                geometry={squareGeometry}
                material={squareMaterial}
                position={[x, y, z]}
                quaternion={quaternion}
                scale={[1 / scale[0], 1 / scale[1], 1]}
              />
            )
          }
        )}
      </>
    ) : null

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        material={material}
        scale={[scale[0], scale[1], 1]}
      />
      {squares}
    </group>
  )
}
