import { create } from "zustand"
import { Texture } from "three"
import { screenMaterial } from "@/components/arcade-screen/screen-material"
import { animate } from "motion"

interface ArcadeScreenStore {
  bootTexture: Texture | null
  setBootTexture: (texture: Texture) => void
  switchToBootTexture: () => void
  animateBootTexture: () => void
}

export const useArcadeScreenStore = create<ArcadeScreenStore>((set) => ({
  bootTexture: null,
  setBootTexture: (texture) => set({ bootTexture: texture }),
  switchToBootTexture: () => {
    const { bootTexture } = useArcadeScreenStore.getState()
    if (bootTexture) {
      screenMaterial.uniforms.map.value = bootTexture
      screenMaterial.uniforms.uRevealProgress = { value: 0.0 }
      useArcadeScreenStore.getState().animateBootTexture()
    }
  },
  animateBootTexture: () => {
    animate(0, 1, {
      duration: 2,
      ease: [0.43, 0.13, 0.23, 0.96],
      onUpdate: (progress) => {
        screenMaterial.uniforms.uRevealProgress.value = progress
      },
      onComplete: () => {
        if (screenMaterial.uniforms.uRevealProgress.value >= 0.99) {
          screenMaterial.uniforms.uFlipY.value = false
        }
      }
    })
  }
}))
