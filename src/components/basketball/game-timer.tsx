import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { DoubleSide, Group, Mesh, ShaderMaterial, Vector3 } from "three"

import fragmentShader from "@/shaders/game-timer/fragment.glsl"
import vertexShader from "@/shaders/game-timer/vertex.glsl"
import { useMinigameStore } from "@/store/minigame-store"

export const GameTimer = () => {
  const timeRemaining = useMinigameStore((state) => state.timeRemaining)
  const isGameActive = useMinigameStore((state) => state.isGameActive)
  const hoopPosition = useMinigameStore((state) => state.hoopPosition)
  const score = useMinigameStore((state) => state.score)
  const timerMaterialRef = useRef<ShaderMaterial | null>(null)
  const scoreMaterialRef = useRef<ShaderMaterial | null>(null)
  const groupRef = useRef<Group | null>(null)
  const { size, viewport } = useThree()

  // Calculate responsive scale based on viewport size
  const calculateScale = () => {
    const viewportAspect = viewport.width / viewport.height
    const baseScale = Math.min(viewport.width / 20, viewport.height / 10) // Scale based on viewport units
    return (
      Math.max(1.2, Math.min(baseScale, 2.0)) * (viewportAspect < 1 ? 0.7 : 1.0)
    )
  }

  // Calculate responsive spacing based on viewport size
  const calculateSpacing = () => {
    const viewportAspect = viewport.width / viewport.height
    const baseSpacing = viewport.width / 15 // Scale spacing based on viewport width
    return (
      Math.max(0.3, Math.min(baseSpacing, 0.8)) *
      (viewportAspect < 1 ? 0.6 : 1.0)
    )
  }

  const DISPLAY_SCALE = useMemo(
    () => calculateScale(),
    [viewport.width, viewport.height]
  )
  const DISPLAY_SPACING = useMemo(
    () => calculateSpacing(),
    [viewport.width, viewport.height]
  )

  const createShaderMaterial = (isScore: boolean) => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uGameTime: { value: isScore ? score : timeRemaining },
        uResolution: { value: [viewport.width, viewport.height] },
        uIsTimerLow: { value: timeRemaining <= 10.0 },
        uIsScore: { value: isScore ? 1.0 : 0.0 },
        uIsActive: { value: isGameActive ? 1.0 : 0.0 }
      },
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      depthTest: false
    })
  }

  const timerMaterial = useMemo(
    () => createShaderMaterial(false),
    [viewport.width, viewport.height]
  )
  const scoreMaterial = useMemo(
    () => createShaderMaterial(true),
    [viewport.width, viewport.height]
  )

  // Update uniforms when viewport changes
  useEffect(() => {
    if (timerMaterialRef.current) {
      timerMaterialRef.current.uniforms.uResolution.value = [
        viewport.width,
        viewport.height
      ]
    }
    if (scoreMaterialRef.current) {
      scoreMaterialRef.current.uniforms.uResolution.value = [
        viewport.width,
        viewport.height
      ]
    }
  }, [viewport.width, viewport.height])

  // Update game state uniforms
  useEffect(() => {
    if (timerMaterialRef.current) {
      timerMaterialRef.current.uniforms.uGameTime.value = timeRemaining
      timerMaterialRef.current.uniforms.uIsTimerLow.value =
        timeRemaining <= 10.0
      timerMaterialRef.current.uniforms.uIsActive.value = isGameActive
        ? 1.0
        : 0.0
    }
    if (scoreMaterialRef.current) {
      scoreMaterialRef.current.uniforms.uIsActive.value = isGameActive
        ? 1.0
        : 0.0
    }
  }, [timeRemaining, isGameActive])

  useEffect(() => {
    if (scoreMaterialRef.current) {
      scoreMaterialRef.current.uniforms.uGameTime.value = score
    }
  }, [score])

  useFrame((_, delta) => {
    if (timerMaterialRef.current) {
      timerMaterialRef.current.uniforms.uTime.value += delta
    }
    if (scoreMaterialRef.current) {
      scoreMaterialRef.current.uniforms.uTime.value += delta
    }
  })

  // Position the displays above the hoop with responsive height
  const displayPosition = useMemo(() => {
    const viewportAspect = viewport.width / viewport.height
    const heightOffset =
      Math.min(viewport.height / 4, 2.0) * (viewportAspect < 1 ? 0.8 : 1.0)
    return new Vector3(
      hoopPosition.x,
      hoopPosition.y + heightOffset - 0.5,
      hoopPosition.z + 0.2
    )
  }, [hoopPosition, viewport.width, viewport.height])

  return (
    <group ref={groupRef} position={displayPosition}>
      {/* Timer Display */}
      <mesh
        position={[-DISPLAY_SPACING, 0, 0]}
        scale={[DISPLAY_SCALE, DISPLAY_SCALE * 0.33, 1]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[1, 1]} />
        <primitive
          object={timerMaterial}
          attach="material"
          ref={timerMaterialRef}
        />
      </mesh>

      {/* Score Display */}
      <mesh
        position={[DISPLAY_SPACING, 0, 0]}
        scale={[DISPLAY_SCALE, DISPLAY_SCALE * 0.33, 1]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[1, 1]} />
        <primitive
          object={scoreMaterial}
          attach="material"
          ref={scoreMaterialRef}
        />
      </mesh>
    </group>
  )
}
