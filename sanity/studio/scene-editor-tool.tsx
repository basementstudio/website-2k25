"use client"

import { useToast } from "@sanity/ui"
import { useCallback, useEffect, useRef } from "react"
import { useClient } from "sanity"

import {
  isRequestMessage,
  isValidOverride,
  MAP_ASSETS_DOC_ID,
  MAX_UPLOAD_BYTES,
  type MeshOverride,
  SCENE_EDITOR_RESULT,
  type SceneEditorResultMessage,
  type SceneEditorStatus,
  type UploadedAsset
} from "@/lib/scene-editor-bridge"

import { apiVersion } from "../env"

const DRAFT_ID = `drafts.${MAP_ASSETS_DOC_ID}`

/** Fields the content lake owns — never carried across when forking a document. */
const stripSystemFields = <T extends Record<string, unknown>>(doc: T) => {
  const { _id, _rev, _createdAt, _updatedAt, ...rest } = doc
  void _id
  void _rev
  void _createdAt
  void _updatedAt
  return rest
}

/**
 * Shape a raw override for the content lake.
 *
 * `_type` names the array member (`meshOverride` in mapAssetsConfig), and
 * `_key` is what the Studio form needs to render and reorder array items —
 * without it the field shows "Missing keys" and can't be edited by hand. The
 * mesh name is a natural key: the payload is built from a Map keyed by it, so
 * it's unique by construction, and reusing it keeps an object's entry stable
 * across saves instead of churning a random key each time.
 *
 * Fields the payload leaves out are left out here too rather than written as
 * null: the array is `set` wholesale, so an absent field is how "this object is
 * no longer hidden / no longer replaced" is expressed.
 */
const toArrayMember = ({ replacement, ...override }: MeshOverride) => ({
  ...override,
  _type: "meshOverride",
  _key: override.mesh.replace(/[^a-zA-Z0-9_-]/g, "_"),
  ...(replacement
    ? {
        replacement: {
          _type: "meshReplacement",
          file: {
            _type: "file",
            asset: { _type: "reference", _ref: replacement.assetId }
          },
          x: replacement.x,
          y: replacement.y,
          z: replacement.z
        }
      }
    : {})
})

/**
 * The "Editor" tool: a top-level Studio tab that shows nothing but the 3D scene.
 *
 * It embeds the standalone /studio-scene route in an iframe rather than mounting
 * <Scene /> in the Studio's React tree. Scene pulls in three.js, R3F, rapier and
 * the whole postprocessing pipeline, and depends on AssetsProvider + the
 * navigation/loading stores — all of which live in the Next app, not the Studio
 * bundle. The iframe keeps the two apps' render trees and bundles separate.
 *
 * It also owns the writes behind the iframe's Save and Publish buttons. Those
 * buttons live next to the gizmo that produces the change, but the mutations
 * have to happen here: this component can ask for a client that's already
 * authenticated as the logged-in editor, so no Sanity write token has to exist
 * in the Next app's environment and every write is permission-checked against
 * the person who clicked. The two frames are same-origin routes of one Next
 * app, so they talk over postMessage — see src/lib/scene-editor-bridge.ts.
 *
 * Save and Publish are deliberately separate, mirroring how the rest of the
 * Studio works: Save only touches `drafts.mapAssetsConfig`, so moving things
 * around can't reach the live site by accident, and the editor previews drafts
 * so you still see your own work. Publish is the step that goes live.
 */
/**
 * Sizing note: this fills the tool pane with `height: 100%`, NOT
 * `position: absolute; inset: 0`. Absolute positioning resolved against an
 * ancestor above the pane, so the iframe covered the whole viewport and its top
 * strip — where the Edit/Live switch sits — ended up hidden behind the Studio's
 * own navbar. `height: 100%` is what sanity-plugin-media's tool uses
 * (`height: "fill"`), so the pane is a definite-height box. `minHeight` is a
 * floor in case a future Studio version renders the pane without one.
 */
export const SceneEditorTool = () => {
  const client = useClient({ apiVersion })
  const toast = useToast()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const readStatus = useCallback(async (): Promise<SceneEditorStatus> => {
    const draft = await client.getDocument(DRAFT_ID)
    return { hasUnpublishedChanges: Boolean(draft) }
  }, [client])

  /**
   * Write the override list to the draft, forking one off the published
   * document if none is open yet — the same thing typing in a Studio field
   * does. The published document is left alone; Publish is what moves it.
   */
  const saveOverrides = useCallback(
    async (overrides: MeshOverride[]) => {
      const [published, draft] = await Promise.all([
        client.getDocument(MAP_ASSETS_DOC_ID),
        client.getDocument(DRAFT_ID)
      ])

      if (!published && !draft) {
        throw new Error(
          "Map Assets Config doesn't exist yet — create it in the Studio first."
        )
      }

      const transaction = client.transaction()
      if (!draft && published) {
        // Mutations apply in order, so the patch below lands on this.
        transaction.createIfNotExists({
          ...stripSystemFields(published),
          _id: DRAFT_ID,
          _type: published._type
        })
      }
      transaction.patch(DRAFT_ID, (p) =>
        p.set({ meshOverrides: overrides.map(toArrayMember) })
      )

      await transaction.commit()
    },
    [client]
  )

  const uploadModel = useCallback(
    async (file: File): Promise<UploadedAsset> => {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `${file.name} is ${(file.size / 1024 / 1024).toFixed(0)}MB — too heavy to drop into the scene. Compress it (KTX2/Draco) first.`
        )
      }

      const asset = await client.assets.upload("file", file, {
        filename: file.name
      })

      return { assetId: asset._id, url: asset.url }
    },
    [client]
  )

  /**
   * Promote the draft to published — exactly what the Studio's own Publish
   * action does, including the part worth knowing: it publishes *everything* in
   * the draft, not only the positions. If someone has an unrelated model swap
   * sitting in the same draft, that goes live too. The button says so.
   */
  const publishDraft = useCallback(async () => {
    const draft = await client.getDocument(DRAFT_ID)
    if (!draft) {
      throw new Error("Nothing to publish — save your changes first.")
    }

    await client
      .transaction()
      .createOrReplace({
        ...stripSystemFields(draft),
        _id: MAP_ASSETS_DOC_ID,
        _type: draft._type
      })
      .delete(DRAFT_ID)
      .commit()
  }, [client])

  useEffect(() => {
    const reply = (
      target: MessageEventSource | null,
      message: SceneEditorResultMessage
    ) => {
      // The source is always the iframe's contentWindow — checked below — so
      // this is the Window overload of postMessage.
      ;(target as Window | null)?.postMessage(message, window.location.origin)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      // Only the iframe this tool rendered — not some other frame on the page.
      if (!event.source || event.source !== iframeRef.current?.contentWindow)
        return
      if (!isRequestMessage(event.data)) return

      // Destructured up front: the `isRequestMessage` narrowing doesn't survive
      // into the async closure below.
      const { requestId, action, overrides = [], file } = event.data
      const source = event.source

      const fail = (error: string) =>
        reply(source, {
          type: SCENE_EDITOR_RESULT,
          requestId,
          ok: false,
          error
        })

      const succeed = ({
        status,
        asset
      }: {
        status: SceneEditorStatus
        asset?: UploadedAsset
      }) =>
        reply(source, {
          type: SCENE_EDITOR_RESULT,
          requestId,
          ok: true,
          status,
          asset
        })

      const run = async () => {
        let asset: UploadedAsset | undefined

        if (action === "save") {
          const invalid = overrides.filter((o) => !isValidOverride(o))
          if (invalid.length > 0) {
            throw new Error(
              `${invalid.length} override(s) had a bad name or coordinate.`
            )
          }
          await saveOverrides(overrides)
          toast.push({
            status: "success",
            title: `Saved ${overrides.length} mesh override${overrides.length === 1 ? "" : "s"}`,
            description: "Draft only — hit Publish to put it on the live site."
          })
        } else if (action === "publish") {
          await publishDraft()
          toast.push({
            status: "success",
            title: "Published Map Assets Config",
            description: "The mesh overrides are live."
          })
        } else if (action === "upload") {
          if (!(file instanceof File)) {
            throw new Error("No file came through — try picking it again.")
          }
          asset = await uploadModel(file)
        }

        return { status: await readStatus(), asset }
      }

      run().then(succeed, (error: unknown) => {
        const description =
          error instanceof Error ? error.message : "Unknown error."
        fail(description)
        // A status poll failing is noise — it retries on the next action.
        if (action !== "status") {
          toast.push({
            status: "error",
            title:
              action === "save"
                ? "Couldn't save"
                : action === "publish"
                  ? "Couldn't publish"
                  : "Couldn't upload the model",
            description
          })
        }
      })
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [publishDraft, readStatus, saveOverrides, toast, uploadModel])

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "24rem",
        overflow: "hidden",
        background: "#000"
      }}
    >
      <iframe
        ref={iframeRef}
        src="/studio-scene"
        title="3D Scene"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: 0
        }}
      />
    </div>
  )
}
