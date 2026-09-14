import { type ReactNode, Suspense, useEffect } from "react"

import { useSceneAssets } from "@/lib/graphics/scene-assets"

/** A suspended subtree is ready only after its resources and children commit. */
function AssetReady({ name }: { name: string }) {
  useEffect(() => {
    useSceneAssets.getState().markReady(name)
  }, [name])
  return null
}

export function SceneAssetBoundary({
  name,
  children
}: {
  name: string
  children: ReactNode
}) {
  return (
    <Suspense fallback={null}>
      {children}
      <AssetReady name={name} />
    </Suspense>
  )
}
