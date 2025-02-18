import { useMemo, memo } from "react"
import {
  BufferGeometry,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3
} from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const RoutingPlane = memo(
  ({
    position,
    rotation,
    geometry,
    scale,
    visible
  }: {
    position: [number, number, number]
    rotation: [number, number, number]
    geometry: BufferGeometry
    scale: [number, number]
    visible: boolean
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
            color: { value: [1.0, 1.0, 1.0] },
            baseSize: { value: 0.05 },
            minViewSize: { value: 0.01 }
          },
          vertexShader: `
          uniform float baseSize;
          uniform float minViewSize;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            float distanceToCamera = length(cameraPosition - worldPosition.xyz);
            
            float scaleFactor = max(minViewSize, baseSize * pow(distanceToCamera / 5.0, 1.2));
            float scale = scaleFactor / baseSize;
            
            vec3 scaledPosition = position * scale;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
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

    const squareData = useMemo(() => {
      if (!geometry.attributes.position || !geometry.attributes.normal)
        return null

      const positions = geometry.attributes.position.array
      const normals = geometry.attributes.normal.array
      const count = geometry.attributes.position.count
      const result = new Array(count)
      const baseVector = new Vector3(0, 0, 1)

      for (let i = 0; i < count; i++) {
        const x = positions[i * 3] * scale[0]
        const y = positions[i * 3 + 1] * scale[1]
        const z = positions[i * 3 + 2]

        const quaternion = new Quaternion().setFromUnitVectors(
          baseVector,
          new Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2])
        )

        result[i] = {
          position: [x, y, z] as [number, number, number],
          quaternion
        }
      }

      return result
    }, [geometry.attributes.position, geometry.attributes.normal, scale])

    const squares = squareData ? (
      <>
        {squareData.map((data, i) => (
          <mesh
            key={i}
            geometry={squareGeometry}
            material={squareMaterial}
            position={data.position}
            quaternion={data.quaternion}
            scale={[1, 1, 1]}
          />
        ))}
      </>
    ) : null

    return (
      <group position={position} rotation={rotation} visible={visible}>
        <mesh
          geometry={geometry}
          material={material}
          scale={[scale[0], scale[1], 1]}
        />
        {squares}
      </group>
    )
  }
)
