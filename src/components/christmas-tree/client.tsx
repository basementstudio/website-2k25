import { MeshDiscardMaterial, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useRef } from "react"
import { Color, Mesh, ShaderMaterial, Vector3 } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio, useSiteAudioStore } from "@/hooks/use-site-audio"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

const CYCLE_TIME = 1.5
const TRANSITION_OVERLAP = 0.75

const COLORS = {
  blue: new Color("#64aaeb"),
  green: new Color("#00ff00"),
  red: new Color("#ff0000"),
  yellow: new Color("#b4b400"),
  star: new Color("#ffff80")
}

const INTENSITIES = {
  blue: 32,
  green: 24,
  red: 48,
  yellow: 32,
  star: 16
}

export const ClientChristmasTree = () => {
  const { specialEvents } = useAssets()
  const { handleMute, music } = useSiteAudio()
  const setIsChristmasSeason = useSiteAudioStore((s) => s.setIsChristmasSeason)
  const isChristmasSeason = useSiteAudioStore((s) => s.isChristmasSeason)
  const setCursor = useCursor()
  const { scene } = useKTX2GLTF<GLTF>(specialEvents.christmas.tree)

  const { services } = useMesh()
  const ballMeshRefs = useRef<Record<string, Mesh[]>>({
    blue: [],
    green: [],
    red: [],
    yellow: [],
    star: []
  })

  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.userData.hasGlobalMaterial) return

        const material = child.material as any
        const materialName = material?.name || ""

        child.material = createGlobalShaderMaterial(child.material, {
          LIGHT: true,
          MATCAP:
            materialName === "RedMetallic" || materialName === "BlueMetallic"
        })

        child.material.side = 2

        child.material.uniforms.lightDirection.value = new Vector3(1, 0, -1)

        child.userData.hasGlobalMaterial = true

        const ornamentTypes = [
          "Blue",
          "Green",
          "Red",
          "Yellow",
          "Star"
        ] as const

        const ornamentType = ornamentTypes.find((type) => materialName === type)
        if (ornamentType) {
          ballMeshRefs.current[ornamentType.toLowerCase()].push(child)

          switch (ornamentType) {
            case "Blue":
              child.material.uniforms.uColor.value = COLORS.blue
              child.material.uniforms.emissive.value = COLORS.blue
              child.material.uniforms.emissiveIntensity.value = INTENSITIES.blue
              break
            case "Green":
              child.material.uniforms.uColor.value = COLORS.green
              child.material.uniforms.emissive.value = COLORS.green
              child.material.uniforms.emissiveIntensity.value =
                INTENSITIES.green
              break
            case "Red":
              child.material.uniforms.uColor.value = COLORS.red
              child.material.uniforms.emissive.value = COLORS.red
              child.material.uniforms.emissiveIntensity.value = INTENSITIES.red
              break
            case "Yellow":
              child.material.uniforms.uColor.value = COLORS.yellow
              child.material.uniforms.emissive.value = COLORS.yellow
              child.material.uniforms.emissiveIntensity.value =
                INTENSITIES.yellow
              break
            case "Star":
              child.material.uniforms.uColor.value = COLORS.star
              child.material.uniforms.emissive.value = COLORS.star
              child.material.uniforms.emissiveIntensity.value = INTENSITIES.star
              break
          }
        }
      }
    })
  }, [scene])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    const phaseTime = CYCLE_TIME / 4
    const cyclePhase = (time % CYCLE_TIME) / phaseTime

    const getTransition = (targetPhase: number) => {
      let localPhase = cyclePhase
      while (localPhase < 0) localPhase += 4
      while (localPhase >= 4) localPhase -= 4

      let phaseDiff = localPhase - targetPhase

      if (phaseDiff > 2) phaseDiff -= 4
      if (phaseDiff <= -2) phaseDiff += 4

      const fadeInStart = -TRANSITION_OVERLAP
      const fadeInEnd = 0.0
      const fadeOutStart = 1.0 - TRANSITION_OVERLAP
      const fadeOutEnd = 1.0

      if (phaseDiff >= fadeInStart && phaseDiff < fadeInEnd) {
        const progress = (phaseDiff - fadeInStart) / TRANSITION_OVERLAP
        return Math.sin(progress * Math.PI * 0.5)
      }

      if (phaseDiff >= 0 && phaseDiff < fadeOutStart) {
        return 1.0
      }

      if (phaseDiff >= fadeOutStart && phaseDiff < fadeOutEnd) {
        const progress = (phaseDiff - fadeOutStart) / TRANSITION_OVERLAP
        return Math.sin((1 - progress) * Math.PI * 0.5)
      }

      return 0
    }

    const greenIntensityMultiplier = getTransition(0)
    const yellowIntensityMultiplier = getTransition(1)
    const redIntensityMultiplier = getTransition(2)
    const blueIntensityMultiplier = getTransition(3)

    ballMeshRefs.current.green.forEach((mesh) => {
      if (mesh.material && "uniforms" in mesh.material) {
        const material = mesh.material as ShaderMaterial
        const intensity = INTENSITIES.green * greenIntensityMultiplier
        material.uniforms.emissiveIntensity.value = intensity
      }
    })

    ballMeshRefs.current.yellow.forEach((mesh) => {
      if (mesh.material && "uniforms" in mesh.material) {
        const material = mesh.material as ShaderMaterial
        const intensity = INTENSITIES.yellow * yellowIntensityMultiplier
        material.uniforms.emissiveIntensity.value = intensity
      }
    })

    ballMeshRefs.current.red.forEach((mesh) => {
      if (mesh.material && "uniforms" in mesh.material) {
        const material = mesh.material as ShaderMaterial
        const intensity = INTENSITIES.red * redIntensityMultiplier
        material.uniforms.emissiveIntensity.value = intensity
      }
    })

    ballMeshRefs.current.blue.forEach((mesh) => {
      if (mesh.material && "uniforms" in mesh.material) {
        const material = mesh.material as ShaderMaterial
        const intensity = INTENSITIES.blue * blueIntensityMultiplier
        material.uniforms.emissiveIntensity.value = intensity
      }
    })

    const baseColor = COLORS.star
    const hsl = { h: 0, s: 0, l: 0 }
    baseColor.getHSL(hsl)
    const animatedHue = (hsl.h + 0.1 * Math.sin(time * 1.2)) % 1
    const animatedColor = new Color()
    animatedColor.setHSL(animatedHue, hsl.s, hsl.l)
    const starOscillation = Math.abs(Math.sin(time * 2.5))
    const animatedStarIntensity =
      INTENSITIES.star + INTENSITIES.star * starOscillation
    ballMeshRefs.current.star.forEach((mesh, i) => {
      if (mesh.material && "uniforms" in mesh.material) {
        const material = mesh.material as ShaderMaterial
        material.uniforms.emissive.value = animatedColor
        material.uniforms.emissiveIntensity.value = animatedStarIntensity
      }
    })
  })

  useEffect(() => {
    if (services.pot) services.pot.visible = false
  }, [services.pot])

  const handlePointerEnter = useCallback(
    (e?: React.PointerEvent<Mesh>) => {
      e?.stopPropagation()
      setTimeout(() => {
        setCursor(
          "pointer",
          isChristmasSeason ? "Stop Christmas Song" : "Play Christmas Song"
        )
      }, 1)
    },
    [isChristmasSeason, setCursor]
  )

  const handleClick = useCallback(() => {
    if (isChristmasSeason) {
      setIsChristmasSeason(false)
      setCursor("pointer", "Play Christmas Song")
    } else {
      setIsChristmasSeason(true)
      if (!music) {
        handleMute()
      }
      setCursor("pointer", "Stop Christmas Song")
    }
  }, [isChristmasSeason, setIsChristmasSeason, setCursor, handleMute, music])

  return (
    <group>
      <primitive object={scene} />
      <mesh
        position={[2.65, 1.65, -6.55]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={() => setCursor("default", null)}
        onPointerDown={handleClick}
      >
        <cylinderGeometry args={[0.1, 0.85, 1.9, 6]} />
        <MeshDiscardMaterial />
      </mesh>
    </group>
  )
}
