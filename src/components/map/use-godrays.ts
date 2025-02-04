import { animate } from "motion"
import { useEffect } from "react"
import { Mesh, ShaderMaterial } from "three"

import { useCurrentScene } from "@/hooks/use-current-scene"

interface GodraysHandlerProps {
  godrays: Mesh[]
}

export const useGodrays = ({ godrays }: GodraysHandlerProps) => {
  const scene = useCurrentScene()

  useEffect(() => {
    godrays.forEach((mesh) => {
      const material = mesh.material as ShaderMaterial

      const shouldShow =
        (mesh.name === "GR_About" && scene === "services") ||
        (mesh.name === "GR_Home" && scene === "home")

      if (material.userData.opacityAnimation)
        material.userData.opacityAnimation.stop()

      material.userData.opacityAnimation = animate(
        material.uniforms.uGodrayOpacity.value,
        shouldShow ? 1 : 0,
        {
          duration: 0.5,
          ease: "easeInOut",
          onUpdate: (latest) =>
            (material.uniforms.uGodrayOpacity.value = latest),
          onComplete: () => delete material.userData.opacityAnimation
        }
      )
    })
  }, [scene, godrays])
}
