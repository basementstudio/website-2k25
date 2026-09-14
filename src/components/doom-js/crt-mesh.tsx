"use client"

import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { CanvasTexture, Vector2 } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createNodeMaterial, SiteMaterial } from "@/lib/graphics/material"
import { createShader as fragmentNodeFactory } from "@/shaders/generated/doom"

interface CRTMeshProps {
  texture: CanvasTexture
}

export function CRTMesh({ texture }: CRTMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<SiteMaterial>(null)

  // Create shader material with uniforms
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uResolution: { value: new Vector2(320, 200) },
      uCurvature: { value: 0.3 },
      uScanlineIntensity: { value: 0.75 },
      uScanlineCount: { value: 200 },
      uVignette: { value: 0.3 },
      uBrightness: { value: 0.05 },
      uContrast: { value: 1.2 }
    }),
    [texture]
  )

  const material = useMemo(
    () => createNodeMaterial({ uniforms, fragmentNodeFactory }),
    [uniforms]
  )
  materialRef.current = material
  useEffect(() => () => material.dispose(), [material])

  // Update time uniform for animated effects
  useFrameCallback((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[8.151, 1.232, -13.9]} ref={meshRef}>
      <planeGeometry args={[0.6, 0.47]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
