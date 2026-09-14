import { Suspense, useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import type { GLTF } from "three/addons/loaders/GLTFLoader.js"

import { useAssets } from "@/components/assets-provider"
import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useIsOnTab } from "@/hooks/use-is-on-tab"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useMesh } from "@/hooks/use-mesh"
import { yieldToBrowser } from "@/lib/graphics/preparation"
import {
  type ItemGroup,
  itemGroups,
  requestSceneAssets,
  requiredItemGroups,
  useSceneAssets
} from "@/lib/graphics/scene-assets"

import { SceneBakes } from "./bakes"
import { usePrepareMapMaterials } from "./prepare-materials"

function Items({ name }: { name: ItemGroup }) {
  const { scene } = useKTX2GLTF<GLTF>(itemGroups[name].url)
  const objects = useMemo(() => {
    const objects = new Map<string, import("three").Object3D>()
    scene.traverse((object) => objects.set(object.name, object))
    return objects
  }, [scene])
  const prepare = usePrepareMapMaterials()
  const { inspectables } = useAssets()
  const [prepared, setPrepared] = useState(false)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => {
    let canceled = false
    const prepareItems = async () => {
      const objects: import("three").Object3D[] = []
      scene.traverse((child) => objects.push(child))
      let lastYield = performance.now()
      for (const child of objects) {
        if (canceled) return
        prepare(child)
        if (performance.now() - lastYield > 6) {
          await yieldToBrowser()
          lastYield = performance.now()
        }
      }
      const meshes: Mesh[] = []
      for (const item of inspectables) {
        const mesh = scene.getObjectByName(item.mesh) as Mesh | undefined
        if (!mesh) continue
        mesh.userData.position = {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        }
        mesh.userData.rotation = {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        }
        meshes.push(mesh)
      }
      useMesh.setState((state) => ({
        inspectables: [
          ...state.inspectables.filter((mesh) => !meshes.includes(mesh)),
          ...meshes
        ]
      }))
      const lobo = scene.getObjectByName("SM_Lobo") as Mesh | undefined
      if (lobo) {
        lobo.visible = false
        useMesh.setState((state) => ({
          weather: { ...state.weather, loboMarino: lobo }
        }))
      }
      setPrepared(true)
    }
    void prepareItems().catch((error) => {
      if (!canceled) setError(error)
    })
    return () => {
      canceled = true
    }
    // Each renderer owns its parsed scene and prepares it once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])
  if (error) throw error
  return (
    <>
      <primitive object={scene} />
      {prepared && (
        <Suspense fallback={null}>
          <SceneBakes root={scene} readinessKey={name} objects={objects} />
        </Suspense>
      )}
    </>
  )
}
export function ItemGroups() {
  const scene = useNavigationStore(
    (state) => state.currentScene?.name ?? "home"
  )
  const presented = useAppLoadingStore((state) => state.hasPresentedFrame)
  const requested = useSceneAssets((state) => state.requested)
  const visited = useMemo(() => new Set<ItemGroup>(), [])
  for (const group of requiredItemGroups(scene)) visited.add(group)
  if (presented) for (const group of requested) visited.add(group)
  return (
    <>
      <WarmDestinations />
      {[...visited].map((group) => (
        <Suspense key={group} fallback={null}>
          <Items name={group} />
        </Suspense>
      ))}
    </>
  )
}

function WarmDestinations() {
  const presented = useAppLoadingStore((state) => state.hasPresentedFrame)
  const requested = useSceneAssets((state) => state.requested)
  const ready = useSceneAssets((state) => state.ready)
  const scene = useNavigationStore(
    (state) => state.currentScene?.name ?? "home"
  )
  const transitioning = useNavigationStore(
    (state) => state.isCameraTransitioning
  )
  const contact = useContactStore((state) => state.isContactOpen)
  const visible = useIsOnTab()
  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    if (
      !presented ||
      !visible ||
      contact ||
      transitioning ||
      innerWidth < 1024 ||
      connection?.saveData ||
      /(^2g$|slow-2g|3g)/.test(connection?.effectiveType ?? "")
    )
      return
    if (
      [...requested, ...requiredItemGroups(scene)].some(
        (group) => !ready.has(group)
      )
    )
      return
    const next = ["services", "people", "blog", "showcase"].find((name) =>
      requiredItemGroups(name).some((group) => !ready.has(group))
    )
    if (!next) return
    let idle: number | undefined
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window)
        idle = requestIdleCallback(() => requestSceneAssets(`/${next}`))
      else requestSceneAssets(`/${next}`)
    }, 1200)
    return () => {
      clearTimeout(timer)
      if (idle !== undefined) cancelIdleCallback(idle)
    }
  }, [presented, requested, ready, scene, transitioning, contact, visible])
  return null
}
