import { animate } from "motion"
import { useEffect } from "react"
import { ShaderMaterial } from "three"

import { skyState } from "@/components/sky/sky-state"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"

export const Godrays = () => {
  const { godrays } = useMesh()
  const scene = useCurrentScene()

  useEffect(() => {
    godrays.forEach((mesh) => {
      const material = mesh.material as ShaderMaterial
      material.depthWrite = false
      material.depthTest = true
      mesh.renderOrder = 2

      const shouldShow =
        (mesh.name === "GR_About" && scene === "services") ||
        (mesh.name === "GR_Home" && scene === "home")

      if (material.userData.opacityAnimation)
        material.userData.opacityAnimation.stop()

      // The per-scene fade lands in userData; the frame callback below folds
      // in the sun/weather factor before it reaches the uniform.
      material.userData.opacityAnimation = animate(
        material.userData.sceneOpacity ?? 0,
        shouldShow ? 1 : 0,
        {
          duration: 0.5,
          ease: "easeInOut",
          onUpdate: (latest) => (material.userData.sceneOpacity = latest),
          onComplete: () => delete material.userData.opacityAnimation
        }
      )
    })
  }, [scene, godrays])

  useFrameCallback(() => {
    const { daylightFactor } = skyState
    godrays.forEach((mesh) => {
      const material = mesh.material as ShaderMaterial
      material.uniforms.uGodrayOpacity.value =
        (material.userData.sceneOpacity ?? 0) * daylightFactor
    })
  })

  return (
    <group>
      {godrays.map((godray) => (
        <primitive object={godray} key={godray.name} />
      ))}
    </group>
  )
}
