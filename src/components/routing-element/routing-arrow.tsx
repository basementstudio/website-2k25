import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh, Vector3 } from "three"

export const RoutingArrow = ({
  position,
  rotation,
  scale
}: {
  position: Vector3
  rotation?: number
  scale: number
}) => {
  const meshRef = useRef<Mesh | null>(null)
  const camera = useThree((state) => state.camera)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion)
      meshRef.current.rotateZ(rotation ?? 0)
      const offset = Math.sin(state.clock.elapsedTime * 3.5) * 0.03

      if (rotation === -Math.PI / 2) {
        meshRef.current.position.x = position.x + offset
      } else {
        meshRef.current.position.y = position.y + offset
      }
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      renderOrder={1}
    >
      <planeGeometry args={[2, 3]} />
      <shaderMaterial
        transparent
        side={2}
        depthWrite={false}
        depthTest={false}
        uniforms={{
          pixelDensity: { value: 12.0 }
        }}
        vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
        fragmentShader={`
            uniform float pixelDensity;
            varying vec2 vUv;
            void main() {
              vec2 grid = floor(vUv * vec2(pixelDensity, pixelDensity * 1.5)); 
              vec2 gridUv = grid / vec2(pixelDensity, pixelDensity * 1.5);
              
              vec2 p = gridUv * 2.0 - 1.0;
              float triangle = step(2.0 * abs(p.x) - 0.9, p.y) * step(p.y, 0.9);
              
              float checker = mod(grid.x + grid.y, 2.0);
              
              if (checker > 0.5 || triangle == 0.0) {
                discard;
              }
              
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
          `}
      />
    </mesh>
  )
}
