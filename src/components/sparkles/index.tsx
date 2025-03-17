import { shaderMaterial, Sparkles as SparklesImpl } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

import { BASE_CONFIG, SPAWN_POINTS } from "@/constants/sparkles"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useFadeAnimation } from "../inspectables/use-fade-animation"
import frag from "./frag.glsl"
import vert from "./vert.glsl"

const SparklesMaterial = shaderMaterial(
  { time: 0, pixelRatio: 2, fadeFactor: 0 },
  vert,
  frag
)

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

export const Sparkle = (props: SparklesProps) => {
  const ref = useRef<typeof SparklesImpl>(null)
  const { fadeFactor } = useFadeAnimation()

  useFrameCallback(() => {
    if (ref.current) {
      // @ts-ignore
      ref.current.uniforms.fadeFactor.value = fadeFactor.current.get()
    }
  })

  return (
    <SparklesImpl {...props}>
      {/* @ts-ignore */}
      <sparklesMaterial
        transparent
        pixelRatio={2}
        depthWrite={false}
        ref={ref}
      />
    </SparklesImpl>
  )
}

export const Sparkles = () => (
  <>
    {SPAWN_POINTS.map((point, index) => (
      <mesh key={index} position={point.position} raycast={() => null}>
        <Sparkle {...BASE_CONFIG} count={point.count} scale={point.scale} />
      </mesh>
    ))}
  </>
)
