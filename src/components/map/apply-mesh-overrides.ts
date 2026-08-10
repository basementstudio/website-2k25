import { type Object3D, Vector3 } from "three"

import type { AssetsResult } from "@/components/assets-provider/fetch-assets"
import {
  isAddedMesh,
  registerEditableObject
} from "@/components/editor/editor-store"

type MeshOverride = AssetsResult["meshOverrides"][number]

/**
 *
 * **Stored coordinates are world-space**, so they have to be converted into
 * each object's parent space here. Storing `Object3D.position` directly does
 * not work: several objects are reparented after load, most notably every
 * inspectable, which <Inspectable> hangs under an animated wrapper group after
 * zeroing the mesh's own position. Read at that point, `position` is an offset
 * from nothing.
 *
 * This runs while the objects are still sitting in the GLB root they loaded in,
 * which is exactly the moment world → local is meaningful, and it must run
 * BEFORE extractMeshes: that function snapshots resting positions into userData
 * (arcade buttons, inspectables) for animations to return to, and those
 * snapshots have to be taken from the overridden transform.
 */
export const applyMeshOverrides = (
  roots: (Object3D | null | undefined)[],
  overrides: MeshOverride[]
) => {
  if (overrides.length === 0) return

  const byName = new Map(overrides.map((o) => [o.mesh, o]))
  const matched = new Set<string>()
  const world = new Vector3()

  for (const root of roots) {
    root?.traverse((child) => {
      const override = byName.get(child.name)
      if (!override) return
      matched.add(child.name)

      if (override.position) {
        world.fromArray(override.position)
        if (child.parent) {
          // Any transform on the GLTF root is folded in by worldToLocal.
          child.parent.updateWorldMatrix(true, false)
          child.position.copy(child.parent.worldToLocal(world))
        } else {
          child.position.copy(world)
        }
      }

      if (override.hidden || override.replacement) {
        child.visible = false
        registerEditableObject(child)
      }
    })
  }

  // A name that matches nothing is a silent no-op otherwise — most likely a
  // mesh renamed in a newer export, which is exactly the case someone needs to

  const missing = [...byName.values()]
    .filter((o) => (o.position || o.hidden) && !isAddedMesh(o.mesh))
    .map((o) => o.mesh)
    .filter((name) => !matched.has(name))
  if (missing.length > 0) {
    console.warn(
      `[3d-config] mesh override(s) matched no object in the map: ${missing.join(", ")}. ` +
        `Remove them in Sanity Studio → 3D Config → Map Assets → Mesh Overrides.`
    )
  }
}
