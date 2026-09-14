import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import type { AssetsResult } from "../../src/components/assets-provider/fetch-assets"
import { ASSETS_BASE } from "../../src/lib/3d-config/asset-manifest"
import { entryAssetDependencies } from "../../src/lib/graphics/asset-dependencies"
import {
  itemGroups,
  requiredItemGroups,
  useSceneAssets
} from "../../src/lib/graphics/scene-assets"

test("preload dependencies match decoded base and entry mesh inventories for every canvas route", () => {
  for (const scene of [
    "home",
    "services",
    "people",
    "showcase",
    "blog",
    "lab",
    "basketball",
    "doom",
    "404"
  ]) {
    const result = entryAssetDependencies(ASSETS_BASE as AssetsResult, scene)
    const names = new Set<string>()
    for (const url of new Set([
      ASSETS_BASE.office,
      ASSETS_BASE.outdoor,
      ASSETS_BASE.godrays,
      ASSETS_BASE.outdoorCars,
      ASSETS_BASE.basketballNet,
      ASSETS_BASE.routingElements,
      ...result.models
    ])) {
      const bytes = readFileSync(`public${url}`)
      const gltf = JSON.parse(
        bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()
      )
      for (const node of gltf.nodes) names.add(node.name)
    }
    const bakes = ASSETS_BASE.bakes.filter((bake) =>
      bake.meshes.some((name) => names.has(name))
    )
    assert.deepEqual(
      new Set(result.lightmaps),
      new Set(bakes.map((bake) => bake.lightmap).filter(Boolean))
    )
    for (const [group, asset] of Object.entries(itemGroups))
      assert.equal(
        result.models.includes(asset.url),
        requiredItemGroups(scene).includes(group as keyof typeof itemGroups)
      )
    assert.equal(new Set(result.images).size, result.images.length)
    for (const url of result.images)
      assert.ok(readFileSync(`public${url}`).length)
  }
})

test("video readiness cannot invalidate CCTV resource preparation", () => {
  useSceneAssets.setState({ ready: new Set(), resourceRevision: 0 })
  useSceneAssets.getState().markReady("base")
  useSceneAssets.getState().markReady("videos:home")
  useSceneAssets.getState().markReady("videos:services")
  assert.equal(useSceneAssets.getState().resourceRevision, 1)
  useSceneAssets.getState().markResourcesChanged()
  assert.equal(useSceneAssets.getState().resourceRevision, 2)
})
