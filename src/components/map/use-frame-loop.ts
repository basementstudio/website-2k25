import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

export const useFrameLoop = () => {
  const shaderMaterial = useCustomShaderMaterial((store) => store.materialsRef)
  const { fadeFactor, inspectingEnabled } = useFadeAnimation()

  useFrameCallback((_, delta) => {
    const fade = fadeFactor.current.get()
    const inspecting = inspectingEnabled.current
    for (const id in shaderMaterial) {
      const material = shaderMaterial[id]
      material.uniforms.uTime.value += delta

      material.uniforms.inspectingEnabled.value = inspecting
      material.uniforms.fadeFactor.value = fade
    }

    if (useMesh.getState().cctv?.screen?.material) {
      // @ts-ignore
      useMesh.getState().cctv.screen.material.uniforms.uTime.value += delta
    }
  })
}
