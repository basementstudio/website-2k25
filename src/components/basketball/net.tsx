import { useFrame, useLoader } from "@react-three/fiber"
import { useEffect, useRef } from "react"

import { Mesh, MeshStandardMaterial, ShaderMaterial, DoubleSide } from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import fragmentShader from "@/shaders/net-shader/fragment.glsl"
import vertexShader from "@/shaders/net-shader/vertex.glsl"

interface NetProps {
  mesh: Mesh
}

const TOTAL_FRAMES = 39
const ANIMATION_SPEED = 12
const OFFSET_SCALE = 1.0

export const Net = ({ mesh }: NetProps) => {
  const meshRef = useRef<Mesh | null>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)

  console.log("mesh texture", mesh.material)

  const offsets = useLoader(EXRLoader, "/va-net-offset.exr")

  useEffect(() => {
    const handleScore = () => {
      // progressRef.current = 0
      progressRef.current = TOTAL_FRAMES / 3 / ANIMATION_SPEED
      isAnimatingRef.current = true
    }

    window.addEventListener("basketball-score", handleScore)
    return () => window.removeEventListener("basketball-score", handleScore)
  }, [])

  useEffect(() => {
    if (!mesh) return
    const mat = mesh.material as MeshStandardMaterial

    const shaderMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,

      uniforms: {
        tDisplacement: { value: offsets },
        currentFrame: { value: 0 },
        totalFrames: { value: TOTAL_FRAMES },
        offsetScale: { value: OFFSET_SCALE },
        vertexCount: { value: mesh.geometry.attributes.position.count }
      }
    })

    materialRef.current = shaderMaterial
    meshRef.current = mesh
    meshRef.current.material = shaderMaterial
  }, [mesh, offsets])

  useFrame((_, delta) => {
    if (materialRef.current && isAnimatingRef.current) {
      progressRef.current += delta
      const currentFrame =
        (progressRef.current * ANIMATION_SPEED) % TOTAL_FRAMES
      materialRef.current.uniforms.currentFrame.value = currentFrame

      // Stop animating after one complete cycle
      if (currentFrame >= TOTAL_FRAMES - 1) {
        isAnimatingRef.current = false
        progressRef.current = 0
      }
    }
  })

  return meshRef.current ? <primitive object={meshRef.current} /> : null
}
