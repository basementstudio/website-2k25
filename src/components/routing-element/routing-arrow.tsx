import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh } from "three"

export const RoutingArrow = ({
  position,
  rotation
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale: number
}) => {
  const meshRef = useRef<Mesh | null>(null)
  const camera = useThree((state) => state.camera)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion)
      meshRef.current.rotateZ(rotation?.[2] ?? 0)
      const offset = Math.sin(state.clock.elapsedTime * 3.5) * 0.03

      if (rotation?.[2] === -1.5708) {
        meshRef.current.position.x = (position?.[0] ?? 0) + offset
      } else {
        meshRef.current.position.y = (position?.[1] ?? 0) + offset
      }
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={0.08}
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
              
              vec2 checkerPos = floor(gl_FragCoord.xy * 0.5);
              float checker = mod(checkerPos.x + checkerPos.y, 2.0);
              
              if (checker < 0.5 || triangle == 0.0) {
                discard;
              }
              
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
          `}
      />
    </mesh>
  )
}
