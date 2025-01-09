import { shaderMaterial, Sparkles as SparklesImpl } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

const SparklesMaterial = shaderMaterial({ time: 0, pixelRatio: 2 }, vert, frag)

extend({ SparklesMaterial })

interface SparklesProps {
  count?: number
  speed?: number | Float32Array
  opacity?: number | Float32Array
  color?: THREE.ColorRepresentation | Float32Array
  size?: number | Float32Array
  scale?: number | [number, number, number] | THREE.Vector3
  noise?: number | [number, number, number] | THREE.Vector3 | Float32Array
}

const baseConfig = {
  color: "#bbb",
  speed: 0.25,
  size: 1
}

const SPAWN_POINTS: {
  position: [number, number, number]
  scale: [number, number, number]
  count: number
}[] = [
  // Center Light
  {
    position: [6.2, 0.25, -11.2],
    scale: [0.6, 0.25, 1.2],
    count: 80
  },
  // Right Light
  {
    position: [8.2, 0.25, -11.2],
    scale: [0.6, 0.25, 1.2],
    count: 80
  },
  // Stairs Light
  {
    position: [4.3, 0.25, -11],
    scale: [1, 0.25, 1.8],
    count: 120
  },
  // Basement Logo
  {
    position: [8.4, 2.55, -14.4],
    scale: [1.9, 0.2, 0.2],
    count: 240
  },
  // Tvs
  {
    position: [8.3, 0.75, -13.4],
    scale: [2.5, 1.5, 0.75],
    count: 60
  }
]

export const Sparkle = (props: SparklesProps) => (
  <SparklesImpl {...props}>
    {/* @ts-ignore */}
    <sparklesMaterial transparent pixelRatio={2} depthWrite={false} />
  </SparklesImpl>
)

export const Sparkles = () => (
  <>
    {SPAWN_POINTS.map((point, index) => (
      <mesh key={index} position={point.position}>
        <Sparkle {...baseConfig} count={point.count} scale={point.scale} />
      </mesh>
    ))}
  </>
)
