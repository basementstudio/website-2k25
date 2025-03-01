import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { RepeatWrapping } from "three"

import { createSteamMaterial } from "@/shaders/material-steam"
import perlin from "@/shaders/material-steam/perlin.jpg"

const CoffeeSteam = () => {
  const noise = useTexture(perlin.src)
  noise.wrapT = RepeatWrapping
  noise.wrapS = RepeatWrapping

  const material = useMemo(() => createSteamMaterial(), [])

  useEffect(() => {
    material.uniforms.uNoise.value = noise
  }, [noise, material])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh rotation={[0, 0, 0]} position={[2.57, 1.21, -13.87]}>
      <planeGeometry args={[0.065, 0.19, 16, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default CoffeeSteam
