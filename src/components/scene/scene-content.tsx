import { lazy, Suspense, useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import ErrorBoundary from "@/components/basketball/error-boundary"
import { CameraController } from "@/components/camera/camera-controller"
import { CharacterInstanceConfig } from "@/components/characters/character-instancer"
import { CharactersSpawn } from "@/components/characters/characters-spawn"
import { UpdateCanvasCursor } from "@/components/custom-cursor"
import { Inspectables } from "@/components/inspectables/inspectables"
import { Lamp } from "@/components/lamp"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { SceneAssetBoundary } from "@/components/loading/scene-asset-boundary"
import { Map } from "@/components/map"
import { BakesLoader } from "@/components/map/bakes"
import { ItemGroups } from "@/components/map/item-groups"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Pets } from "@/components/pets"
import { Renderer } from "@/components/postprocessing/renderer"
import { AnimationController } from "@/components/shared/AnimationController"
import { Sparkles } from "@/components/sparkles"
import { WebGlTunnelOut } from "@/components/tunnel"
import { usePreloadSceneAssets } from "@/hooks/use-preload-assets"
import { AdaptiveQuality } from "@/lib/graphics/quality"
import { SceneVideos } from "@/lib/graphics/videos"

import { DoomJs } from "../doom-js"

const HoopMinigame = lazy(() =>
  import("@/components/basketball/hoop-minigame").then((mod) => ({
    default: mod.HoopMinigame
  }))
)
const PhysicsWorld = lazy(() =>
  import("@react-three/rapier").then((mod) => ({ default: mod.Physics }))
)

export default function SceneContent() {
  usePreloadSceneAssets(useAssets())
  const canRunMainApp = useAppLoadingStore((s) => s.canRunMainApp)
  const isBasketball = useNavigationStore(
    (s) => s.currentScene?.name === "basketball"
  )
  const isBlog = useNavigationStore((s) => s.currentScene?.name === "blog")
  const needsPhysics = useRef(false)
  if (isBasketball || isBlog) needsPhysics.current = true
  return (
    <AnimationController>
      <AdaptiveQuality />
      <UpdateCanvasCursor />
      <Renderer
        sceneChildren={
          <>
            <DoomJs />
            <Suspense fallback={null}>
              <Map />
            </Suspense>
            <BakesLoader />
            <SceneVideos />
            <ItemGroups />
            <Suspense fallback={null}>
              <WebGlTunnelOut />
            </Suspense>
            <Suspense fallback={null}>
              <CameraController />
            </Suspense>
            {canRunMainApp && (
              <SceneAssetBoundary name="details">
                <Inspectables />
                <Sparkles />
              </SceneAssetBoundary>
            )}
            {/* Never unmount: tearing a world down while its bodies are
                      being removed throws out of rapier's wasm. */}
            {canRunMainApp && needsPhysics.current && (
              <SceneAssetBoundary name="physics">
                <PhysicsWorld paused={!isBasketball && !isBlog}>
                  <Lamp />
                  {isBasketball && (
                    <ErrorBoundary>
                      <HoopMinigame />
                    </ErrorBoundary>
                  )}
                </PhysicsWorld>
              </SceneAssetBoundary>
            )}
            <Suspense fallback={null}>
              {canRunMainApp && (
                <>
                  <CharacterInstanceConfig />
                  <CharactersSpawn />
                </>
              )}
            </Suspense>
            {canRunMainApp && (
              <SceneAssetBoundary name="pets">
                <Pets />
              </SceneAssetBoundary>
            )}
          </>
        }
      />
    </AnimationController>
  )
}
