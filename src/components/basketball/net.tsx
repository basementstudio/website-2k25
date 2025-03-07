import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import fragmentShader from "@/shaders/net-shader/fragment.glsl"
import vertexShader from "@/shaders/net-shader/vertex.glsl"
import { useMinigameStore } from "@/store/minigame-store"

interface NetProps {
  mesh: THREE.Mesh
}

export const Net = ({ mesh }: NetProps) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const timeRef = useRef(0)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const scoreAnimationRef = useRef(0)
  const hoopPosition = useMinigameStore((state) => state.hoopPosition)
  const isDragging = useMinigameStore((state) => state.isDragging)

  const shaderMaterial = useMemo(() => {
    const originalMaterial = mesh.userData.originalMaterial || mesh.material
    const texture = originalMaterial?.map

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveAmplitude: { value: 0.015 },
        uWaveFrequency: { value: 6.0 },
        uWaveSpeed: { value: 2.0 },
        map: { value: texture },
        uBallPosition: { value: new THREE.Vector3() },
        uBallInfluence: { value: 0.0 },
        uScoreAnimation: { value: 0.0 },
        uDeltaTime: { value: 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [mesh])

  useEffect(() => {
    if (mesh && mesh.isMesh) {
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material
      }

      mesh.material = shaderMaterial
      materialRef.current = shaderMaterial
      meshRef.current = mesh

      mesh.visible = true
      mesh.updateMatrixWorld(true)

      const handleScore = () => {
        scoreAnimationRef.current = 1.0
      }

      window.addEventListener("basketball-score", handleScore)

      return () => {
        if (mesh) {
          mesh.material = mesh.userData.originalMaterial
        }
        window.removeEventListener("basketball-score", handleScore)
      }
    }
  }, [mesh, shaderMaterial])

  useFrame((state, delta) => {
    if (materialRef.current) {
      timeRef.current += delta
      materialRef.current.uniforms.uTime.value = timeRef.current

      // Decay score animation
      if (scoreAnimationRef.current > 0) {
        const decayRate = scoreAnimationRef.current > 0.5 ? 3.0 : 1.5
        scoreAnimationRef.current = Math.max(
          0,
          scoreAnimationRef.current - delta * decayRate
        )
        materialRef.current.uniforms.uScoreAnimation.value =
          scoreAnimationRef.current
      }

      const basketball = state.scene.getObjectByName("basketball")
      if (basketball && !isDragging) {
        const ballWorldPos = new THREE.Vector3()
        basketball.getWorldPosition(ballWorldPos)

        const sensorPos = new THREE.Vector3(
          hoopPosition.x - 0.04,
          hoopPosition.y - 0.35,
          hoopPosition.z + 0.35
        )
        const distToSensor = ballWorldPos.distanceTo(sensorPos)

        const sensorInfluence = distToSensor < 0.5 ? 2.0 : 0
        const hoopInfluence =
          distToSensor < 1.5 ? (1.5 - distToSensor) * 0.8 : 0.0
        const totalInfluence = Math.max(sensorInfluence, hoopInfluence) * 0.1

        materialRef.current.uniforms.uBallPosition.value.copy(ballWorldPos)
        materialRef.current.uniforms.uBallInfluence.value = totalInfluence
      } else {
        materialRef.current.uniforms.uBallInfluence.value = 0.0
      }
    }
  })

  return meshRef.current ? <primitive object={meshRef.current} /> : null
}
