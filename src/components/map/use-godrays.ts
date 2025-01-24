import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { Mesh, ShaderMaterial } from "three"

interface GodraysHandlerProps {
  godrays: Mesh[]
}

export const useGodrays = ({ godrays }: GodraysHandlerProps) => {
  const pathname = usePathname()

  useEffect(() => {
    godrays.forEach((mesh) => {
      const material = mesh.material as ShaderMaterial

      const shouldShow =
        (mesh.name === "GR_About" && pathname === "/services") ||
        (mesh.name === "GR_Home" && pathname === "/")

      // Animate opacity
      const startValue = material.uniforms.uGodrayOpacity.value
      const endValue = shouldShow ? 1 : 0
      const duration = 500 // 1 second transition
      const startTime = performance.now()

      if (material.userData.opacityAnimation) {
        cancelAnimationFrame(material.userData.opacityAnimation)
      }

      const animate = () => {
        const currentTime = performance.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease in-out cubic
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2

        material.uniforms.uGodrayOpacity.value =
          startValue + (endValue - startValue) * easeProgress

        if (progress < 1) {
          material.userData.opacityAnimation = requestAnimationFrame(animate)
        } else {
          delete material.userData.opacityAnimation
        }
      }

      animate()
    })
  }, [pathname, godrays])
}
