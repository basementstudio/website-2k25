import type { Metadata } from "next"
import { Suspense } from "react"

import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssetsPreview } from "@/components/assets-provider/fetch-assets"
import { EditorOverlay } from "@/components/editor/editor-overlay"
import { InspectableProvider } from "@/components/inspectables/context"
import { CanvasLayer } from "@/components/layout/canvas-layer"
import { Navbar } from "@/components/layout/navbar"

import { SceneBootstrap } from "./scene-bootstrap"

// Standalone canvas host, embedded in an iframe by the Studio's "Editor" tool
// (sanity/studio/scene-editor-tool.tsx). Deliberately outside the (site) route
// group so it inherits none of that layout: no navbar, no contact modal, no
// page content, no analytics — just the 3D canvas.
//
// It reuses <CanvasLayer /> rather than mounting <Scene /> directly, so the
// loading handler, custom cursor and inspectable viewer behave as they do on
// the site instead of being reimplemented here.

export const metadata: Metadata = {
  title: "Scene Editor",
  robots: { index: false, follow: false }
}

// Reads drafts, not published: the editor's Save writes mesh positions to the
// draft and only Publish makes them live, so the tool has to preview the draft
// or saved work would vanish on reload. That read is uncached by design, which
// under Cache Components means it has to sit behind a Suspense boundary — hence
// the split into a child component.
const SceneEditor = async () => {
  const assets = await fetchAssetsPreview()

  return (
    <AssetsProvider assets={assets}>
      <InspectableProvider>
        <SceneBootstrap sceneName="home" />
        <CanvasLayer />
        {/* <Navbar /> is an async server component, so it's rendered here
            unconditionally and passed as a slot; EditorOverlay shows it only in
            live mode. */}
        <EditorOverlay navbar={<Navbar />} />
      </InspectableProvider>
    </AssetsProvider>
  )
}

const StudioScenePage = () => (
  <Suspense fallback={null}>
    <SceneEditor />
  </Suspense>
)

export default StudioScenePage
