import { useTexture } from "@react-three/drei"
import { useEffect } from "react"
import { ClampToEdgeWrapping, NearestFilter, SRGBColorSpace } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMesh } from "@/hooks/use-mesh"

export const CITY_POSITION = [-56, 1.38, 72] as const
export const CITY_SCALE = { x: 7.43, y: 23.7 }

export const CitySkyline = () => {
  const {
    mapTextures: { cityDay, cityNight }
  } = useAssets()

  const [dayTexture, nightTexture] = useTexture([cityDay, cityNight])
  const material = useMesh((s) => s.city.material)

  useEffect(() => {
    if (!material) return

    for (const texture of [dayTexture, nightTexture]) {
      texture.flipY = false
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = texture.wrapT = ClampToEdgeWrapping
      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
    }

    material.uniforms.map.value = dayTexture
    material.uniforms.nightMap.value = nightTexture
  }, [material, dayTexture, nightTexture])

  return null
}
