import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

export const useFrameLoop = () => {
  const shaderMaterial = useCustomShaderMaterial((store) => store.materialsRef)
  const { fadeFactor, inspectingEnabled } = useFadeAnimation()

  useFrameCallback((_, delta) => {
    Object.values(shaderMaterial).forEach((material) => {
      material.uniforms.uTime.value += delta

      material.uniforms.inspectingEnabled.value = inspectingEnabled.current
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
    })

    const cctvUTime = useMesh.getState().cctv?.uTime
    if (cctvUTime) {
      cctvUTime.value += delta
    }
  })
}
