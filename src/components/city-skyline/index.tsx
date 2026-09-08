import { useTexture } from "@react-three/drei"
import { useEffect } from "react"
import { ClampToEdgeWrapping, NearestFilter, SRGBColorSpace } from "three"

import { useAssets } from "@/components/assets-provider"
import { useMesh } from "@/hooks/use-mesh"

// Tuned against the skyline photographs via the ?debug "city skyline"
// sliders — overrides the transform authored for the old baked texture.
// Applied synchronously in the Map traverse so the debug sliders never see
// the pre-bake values.
export const CITY_POSITION = [-56, 1.38, 72] as const
export const CITY_SCALE = { x: 7.43, y: 23.7 }

/**
 * Swaps the TX_Building billboard's baked texture for the day/night skyline
 * pair. The crossfade itself lives in the global shader (CITY define) and is
 * driven by the Sky component via cityNightUniform.
 */
export const CitySkyline = () => {
  const {
    mapTextures: { cityDay, cityNight }
  } = useAssets()

  const [dayTexture, nightTexture] = useTexture([cityDay, cityNight])
  const material = useMesh((s) => s.city.material)

  useEffect(() => {
    if (!material) return

    for (const texture of [dayTexture, nightTexture]) {
      // Match the GLTF texture convention the mesh UVs were authored for.
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
