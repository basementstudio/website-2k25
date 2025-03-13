import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { RepeatWrapping } from "three"

import { usePausableTime } from "@/hooks/use-pausable-time"
import { createSteamMaterial } from "@/shaders/material-steam"
import perlin from "@/shaders/material-steam/perlin.jpg"

export const CoffeeSteam = () => {
  const noise = useTexture(perlin.src)
  noise.wrapT = RepeatWrapping
  noise.wrapS = RepeatWrapping

  const material = useMemo(() => createSteamMaterial(), [])

  const pausableTimeRef = usePausableTime()

  useEffect(() => {
    material.uniforms.uNoise.value = noise
  }, [noise, material])

  useFrame(() => {
    material.uniforms.uTime.value = pausableTimeRef.current
  })

  return (
    <mesh rotation={[0, 0, 0]} position={[2.57, 1.21, -13.87]}>
      <planeGeometry args={[0.065, 0.19, 16, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
