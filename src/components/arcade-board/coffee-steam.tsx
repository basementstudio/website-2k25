import steamFrag from "@/shaders/steam/steam.frag"
import steamVert from "@/shaders/steam/steam.vert"
import { useTexture } from "@react-three/drei"

import perlin from "@/shaders/steam/perlin.jpg"
import { useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { ShaderMaterial, RepeatWrapping } from "three"

const CoffeeSteam = () => {
  const noise = useTexture(perlin.src)
  noise.wrapT = RepeatWrapping
  noise.wrapS = RepeatWrapping

  const material = useMemo(() => {
    return new ShaderMaterial({
      transparent: true,
      side: 2,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uNoise: { value: noise }
      },
      fragmentShader: steamFrag,
      vertexShader: steamVert
    })
  }, [noise])

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
