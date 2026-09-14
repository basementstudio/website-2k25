import { create } from "zustand"

import manifest from "@/lib/3d-config/scene-assets.json"

export type ItemGroup = keyof typeof manifest
export const itemGroups = manifest
export function requiredItemGroups(scene: string): ItemGroup[] {
  if (scene === "404") return Object.keys(itemGroups) as ItemGroup[]
  if (scene === "home" || scene === "showcase" || !scene) return ["showcase"]
  if (scene === "services") return ["shared", "services"]
  if (scene === "people") return ["people"]
  if (scene === "blog") return ["blog"]
  return []
}
export const useSceneAssets = create<{
  requested: ReadonlySet<ItemGroup>
  ready: ReadonlySet<string>
  resourceRevision: number
  markResourcesChanged: () => void
  markReady: (key: string) => void
}>((set) => ({
  ready: new Set(),
  requested: new Set(),
  resourceRevision: 0,
  markResourcesChanged: () =>
    set((state) => ({ resourceRevision: state.resourceRevision + 1 })),
  markReady: (key) =>
    set((state) =>
      state.ready.has(key)
        ? state
        : {
            ready: new Set([...state.ready, key]),
            resourceRevision:
              state.resourceRevision + (key.startsWith("videos:") ? 0 : 1)
          }
    )
}))
export const isSceneReady = (scene: string, ready: ReadonlySet<string>) =>
  ready.has("base") && requiredItemGroups(scene).every((key) => ready.has(key))

/** Everything visible at entry must exist before the wireframe can fade out. */
export const isEntrySceneReady = (scene: string, ready: ReadonlySet<string>) =>
  isSceneReady(scene, ready) &&
  ["characters", "pets", "details", `videos:${scene}`].every((key) =>
    ready.has(key)
  ) &&
  (!(scene === "blog" || scene === "basketball") || ready.has("physics")) &&
  (scene !== "lab" || ready.has("arcade")) &&
  (scene !== "doom" || ready.has("doom"))

/** Navigation intent starts destination resources before the route changes. */
export function requestSceneAssets(route: string) {
  const path = route.split(/[?#]/)[0]
  if (!path.startsWith("/") || path.startsWith("//")) return
  const section = path.split("/")[1] || "home"
  const scene = section === "careers" ? "people" : section
  const groups = requiredItemGroups(scene)
  useSceneAssets.setState((state) => {
    if (groups.every((group) => state.requested.has(group))) return state
    return { requested: new Set([...state.requested, ...groups]) }
  })
}
