import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh, ShaderMaterial } from "three"

const arrowMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  fragmentShader: `
    uniform float uTime;

    varying vec2 vUv;

    void main() {
      vec2 checkerPos = floor(gl_FragCoord.xy * 0.5);
      float pattern = mod(checkerPos.x + checkerPos.y, 2.0);
      float alpha = pattern == 1.0 ? 1.0 : 0.2;
      
      gl_FragColor = vec4(2.0, 2.0, 2.0, alpha);
    }
  `,
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  depthTest: false,
  transparent: true
})

export const RoutingArrow = ({
  position,
  rotation,
  scale
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}) => {
  const SPEED = 2
  const AMPLITUDE = 0.05

  const meshRef = useRef<Mesh>(null)
  const initialY = position[1]

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        initialY + Math.sin(state.clock.elapsedTime * SPEED) * AMPLITUDE
    }
  })

  return (
    <>
      <mesh ref={meshRef} rotation={rotation} position={position} scale={scale}>
        <coneGeometry args={[0.25, 0.5, 32]} />
        <primitive object={arrowMaterial} attach="material" />
      </mesh>
    </>
  )
}
