import type { AssetsResult } from "@/components/assets-provider/fetch-assets"
import baseMeshes from "@/lib/3d-config/base-meshes.json"

import { itemGroups, requiredItemGroups } from "./scene-assets"

/** Use the same mesh-name selection as SceneBakes, before GLTF decoding. */
export function entryAssetDependencies(assets: AssetsResult, scene: string) {
  const groups = requiredItemGroups(scene)
  const names = new Set([
    ...baseMeshes,
    ...groups.flatMap((group) => itemGroups[group].meshes)
  ])
  const bakes = assets.bakes.filter((bake) =>
    bake.meshes.some((name) => names.has(name))
  )
  return {
    models: [
      // These unblock scene setup. The other base models already start together
      // in Map's loader; preloading all of them crowds out the office download.
      assets.office,
      assets.routingElements,
      ...groups.map((group) => itemGroups[group].url)
    ],
    lightmaps: [...new Set(bakes.map((bake) => bake.lightmap).filter(Boolean))],
    images: [
      ...new Set(
        [
          // Map's child Suspense readers and the complete-entry reveal gate
          // already require these on every canvas route. Avoid moving their
          // requests behind the models when lighting is fetched earlier.
          ...Object.values(assets.mapTextures),
          assets.arcade.boot,
          assets.characters.textureBody,
          assets.characters.textureFaces,
          assets.characters.textureArms,
          assets.characters.textureComic,
          assets.pets.pureTexture,
          assets.pets.bostonTexture,
          ...bakes.map((bake) => bake.ambientOcclusion),
          ...assets.matcaps
            .filter((map) => names.has(map.mesh))
            .map((map) => map.file),
          ...assets.glassReflexes
            .filter((map) => names.has(map.mesh))
            .map((map) => map.url)
        ].filter(Boolean)
      )
    ]
  }
}
