import { MeshDiscardMaterial } from "@/components/mesh-discard-material"
import { useCallback, useEffect } from "react"
import { Color, Mesh, Vector3 } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio, useSiteAudioStore } from "@/hooks/use-site-audio"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

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

// Phase offsets matching the original 4-phase cycling order
const ORNAMENT_PHASES: Record<string, number> = {
  Green: 0,
  Yellow: 1,
  Red: 2,
  Blue: 3
}

export const ClientChristmasTree = () => {
  const { specialEvents } = useAssets()
  const { handleMute, music } = useSiteAudio()
  const setIsChristmasSeason = useSiteAudioStore((s) => s.setIsChristmasSeason)
  const isChristmasSeason = useSiteAudioStore((s) => s.isChristmasSeason)
  const setCursor = useCursor()
  const { scene } = useKTX2GLTF<GLTF>(specialEvents.christmas.tree)

  const { services } = useMesh()

  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.userData.hasGlobalMaterial) return

        const material = child.material as any
        const materialName = material?.name || ""

        // Detect ornament type before creating material
        const ornamentPhase = ORNAMENT_PHASES[materialName]
        const isStar = materialName === "Star"
        const isOrnament = ornamentPhase !== undefined
        const isMatcap =
          materialName === "RedMetallic" || materialName === "BlueMetallic"

        child.material = createGlobalShaderMaterial(child.material, {
          LIGHT: true,
          MATCAP: isMatcap,
          ORNAMENT: isOrnament,
          ORNAMENT_STAR: isStar
        })

        child.material.side = 2
        child.material.uniforms.lightDirection.value = new Vector3(1, 0, -1)
        child.userData.hasGlobalMaterial = true

        // Set ornament uniforms once — cycling computed on GPU via timerGlobal()
        if (isOrnament) {
          const key = materialName.toLowerCase() as keyof typeof COLORS
          child.material.uniforms.uColor.value = COLORS[key]
          child.material.uniforms.emissive.value = COLORS[key]
          child.material.uniforms.ornamentPhase.value = ornamentPhase
          child.material.uniforms.ornamentBaseIntensity.value = INTENSITIES[key]
        }

        if (isStar) {
          child.material.uniforms.uColor.value = COLORS.star
          child.material.uniforms.emissive.value = COLORS.star
          child.material.uniforms.ornamentBaseIntensity.value = INTENSITIES.star
        }
      }
    })
  }, [scene])

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
