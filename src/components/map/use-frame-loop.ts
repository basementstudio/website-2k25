import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { globalUniforms } from "@/shaders/material-global-shader"

export const useFrameLoop = () => {
  const { fadeFactor, inspectingEnabled } = useFadeAnimation()

  useFrameCallback((_, delta) => {
    globalUniforms.uTime.value += delta
    globalUniforms.inspectingEnabled.value = inspectingEnabled.current ? 1 : 0
    globalUniforms.fadeFactor.value = fadeFactor.current.get()

    const cctvUTime = useMesh.getState().cctv?.uTime
    if (cctvUTime) {
      cctvUTime.value += delta
    }
  })
}
