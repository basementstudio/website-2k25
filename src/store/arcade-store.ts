import { create } from "zustand"
import { Texture } from "three"
import { screenMaterial } from "@/components/arcade-screen/screen-material"

interface ArcadeScreenStore {
  bootTexture: Texture | null
  setBootTexture: (texture: Texture) => void
  switchToBootTexture: () => void
}

export const useArcadeScreenStore = create<ArcadeScreenStore>((set) => ({
  bootTexture: null,
  setBootTexture: (texture) => set({ bootTexture: texture }),
  switchToBootTexture: () => {
    const { bootTexture } = useArcadeScreenStore.getState()
    if (bootTexture) {
      screenMaterial.uniforms.map.value = bootTexture
      screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
    }
  }
}))
