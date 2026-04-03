import { useFrame, useLoader } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { Mesh, NearestFilter, Texture } from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useMesh } from "@/hooks/use-mesh"
import { createNetMaterial } from "@/shaders/material-net"

import { useAssets } from "../assets-provider"

const TOTAL_FRAMES = 39
const ANIMATION_SPEED = 16
const OFFSET_SCALE = 1.5

export const Net = () => {
  const meshRef = useRef<Mesh | null>(null)
  const uniformsRef = useRef<ReturnType<
    typeof createNetMaterial
  >["uniforms"] | null>(null)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const textureRef = useRef<Texture | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { mapTextures } = useAssets()
  const net = useMesh((state) => state.basketball.net)

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
    if (!net) return

    const originalMaterial = net.material as any
    if (originalMaterial && originalMaterial.map) {
      const texture = originalMaterial.map.clone()
      texture.needsUpdate = true
      textureRef.current = texture

      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter
      texture.generateMipmaps = false

      const { material: netMat, uniforms } = createNetMaterial()
      uniforms.tDisplacement.value = offsets
      uniforms.map.value = texture
      uniforms.totalFrames.value = TOTAL_FRAMES
      uniforms.offsetScale.value = OFFSET_SCALE

      uniformsRef.current = uniforms
      meshRef.current = net
      meshRef.current.material = netMat

      texture.needsUpdate = true
      offsets.needsUpdate = true

      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    }
  }, [net, offsets])

  useFrame((_, delta) => {
    if (uniformsRef.current && isAnimatingRef.current) {
      progressRef.current += delta
      const currentFrame =
        (progressRef.current * ANIMATION_SPEED) % TOTAL_FRAMES
      uniformsRef.current.currentFrame.value = currentFrame

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
