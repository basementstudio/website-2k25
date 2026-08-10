"use client"

import { Component, memo, type ReactNode, Suspense, useMemo } from "react"
import { Mesh, type MeshStandardMaterial } from "three"
import type { GLTF } from "three/examples/jsm/Addons.js"

import type { AssetsResult } from "@/components/assets-provider/fetch-assets"
import {
  REPLACEMENT_ASSET_TAG,
  REPLACEMENT_TAG,
  useEditorStore
} from "@/components/editor/editor-store"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

export interface MeshReplacementPlacement {
  mesh: string
  assetId: string
  url: string
  position: [number, number, number]
}

export const useMeshReplacements = (
  overrides: AssetsResult["meshOverrides"]
): MeshReplacementPlacement[] => {
  const edits = useEditorStore((state) => state.edits)

  return useMemo(() => {
    const byMesh = new Map<string, MeshReplacementPlacement>(
      overrides.flatMap((o) =>
        o.replacement
          ? [
              [
                o.mesh,
                {
                  mesh: o.mesh,
                  assetId: o.replacement.assetId,
                  url: o.replacement.url,
                  position: o.replacement.position
                }
              ] as const
            ]
          : []
      )
    )

    for (const [mesh, edit] of Object.entries(edits)) {
      if (edit.replacement === undefined) continue
      if (edit.replacement === null) byMesh.delete(mesh)
      else
        byMesh.set(mesh, {
          mesh,
          assetId: edit.replacement.assetId,
          url: edit.replacement.url,
          position: edit.replacement.position
        })
    }

    return [...byMesh.values()]
  }, [overrides, edits])
}

const ReplacementModel = ({
  mesh,
  assetId,
  url,
  position
}: MeshReplacementPlacement) => {
  const { scene } = useKTX2GLTF<GLTF>(url)

  const object = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.raycast = () => null
      child.material = Array.isArray(child.material)
        ? child.material.map((material) =>
            createGlobalShaderMaterial(material as MeshStandardMaterial)
          )
        : createGlobalShaderMaterial(child.material as MeshStandardMaterial)
      child.userData.hasGlobalMaterial = true
    })

    return clone
  }, [scene])

  return (
    <group
      position={position}
      name={mesh}
      userData={{
        [REPLACEMENT_TAG]: mesh,
        [REPLACEMENT_ASSET_TAG]: { assetId, url }
      }}
    >
      <primitive object={object} />
    </group>
  )
}

class ReplacementBoundary extends Component<
  { mesh: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error(
      `[3d-config] the replacement model for "${this.props.mesh}" failed to load; skipping it. ` +
        `Check it in Sanity Studio → 3D Config → Map Assets → Mesh Overrides.`,
      error
    )
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export const MeshReplacements = memo(
  ({ placements }: { placements: MeshReplacementPlacement[] }) => (
    <>
      {placements.map((placement) => (
        <ReplacementBoundary key={placement.mesh} mesh={placement.mesh}>
          <Suspense fallback={null}>
            <ReplacementModel {...placement} />
          </Suspense>
        </ReplacementBoundary>
      ))}
    </>
  )
)

MeshReplacements.displayName = "MeshReplacements"
