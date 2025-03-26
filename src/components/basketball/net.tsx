import { useFrame, useLoader } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { DoubleSide, Mesh, NearestFilter, ShaderMaterial, Texture } from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import fragmentShader from "@/shaders/net-shader/fragment.glsl"
import vertexShader from "@/shaders/net-shader/vertex.glsl"

import { useAssets } from "../assets-provider"

interface NetProps {
  mesh: Mesh
}

const TOTAL_FRAMES = 39
const ANIMATION_SPEED = 16
const OFFSET_SCALE = 1.5

export const Net = ({ mesh }: NetProps) => {
  const meshRef = useRef<Mesh | null>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const textureRef = useRef<Texture | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { mapTextures } = useAssets()

  const offsets = useLoader(EXRLoader, mapTextures.basketballVa)

  useEffect(() => {
    const handleScore = () => {
      progressRef.current = TOTAL_FRAMES / 3 / ANIMATION_SPEED
      isAnimatingRef.current = true
    }

    window.addEventListener("basketball-score", handleScore, { passive: true })
    return () => window.removeEventListener("basketball-score", handleScore)
  }, [])

  useEffect(() => {
    if (!mesh) return

    const originalMaterial = mesh.material as any
    if (originalMaterial && originalMaterial.map) {
      const texture = originalMaterial.map.clone()
      texture.needsUpdate = true
      textureRef.current = texture

      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter
      texture.generateMipmaps = false

      const shaderMaterial = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: DoubleSide,

        uniforms: {
          tDisplacement: { value: offsets },
          map: { value: texture },
          currentFrame: { value: 0 },
          totalFrames: { value: TOTAL_FRAMES },
          offsetScale: { value: OFFSET_SCALE },
          vertexCount: { value: mesh.geometry.attributes.position.count }
        }
      })

      materialRef.current = shaderMaterial
      meshRef.current = mesh
      meshRef.current.material = shaderMaterial

      shaderMaterial.needsUpdate = true
      texture.needsUpdate = true
      offsets.needsUpdate = true

      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    }
  }, [mesh, offsets])

  useFrame((_, delta) => {
    if (materialRef.current && isAnimatingRef.current) {
      progressRef.current += delta
      const currentFrame =
        (progressRef.current * ANIMATION_SPEED) % TOTAL_FRAMES
      materialRef.current.uniforms.currentFrame.value = currentFrame

      if (currentFrame >= TOTAL_FRAMES - 1) {
        isAnimatingRef.current = false
        progressRef.current = 0
      }
    }
  })

  return (
    meshRef.current && (
      <primitive object={meshRef.current} visible={isVisible} />
    )
  )
}
