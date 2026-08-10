/**
 * Message contract between the Studio's "Editor" tool and the /studio-scene
 * iframe it embeds (sanity/studio/scene-editor-tool.tsx).
 *
 * The canvas lives in the Next app and the Sanity writes happen in the Studio,
 * so Save and Publish have to cross the iframe boundary. They go through
 * postMessage rather than a Next route handler on purpose: the Studio already
 * holds an authenticated client for the logged-in editor, so nothing here needs
 * a Sanity write token in the app's environment, and every mutation is
 * attributed to (and permission-checked against) the person who clicked.
 *
 * Both windows are same-origin — /studio and /studio-scene are routes of the
 * same Next app — so every message is posted with and checked against
 * `window.location.origin`.
 */

/** Document the overrides are written to. Singleton; see sanity.config.ts. */
export const MAP_ASSETS_DOC_ID = "mapAssetsConfig"

export const SCENE_EDITOR_REQUEST = "scene-editor:request"
export const SCENE_EDITOR_RESULT = "scene-editor:result"

/**
 * - `save` — write the overrides to the **draft** only. Nothing changes on the
 *   live site; the editor previews the draft, so you see it immediately.
 * - `publish` — promote the whole draft to published, which is what puts the
 *   positions on the live site.
 * - `status` — no mutation; just asks whether a draft is currently pending, so
 *   the Publish button can enable itself on load.
 */
export type SceneEditorAction = "save" | "publish" | "status" | "upload"

export interface MeshReplacement {
  assetId: string
  x: number
  y: number
  z: number
}

/**
 * form and projects in GROQ without an extra object hop.
 *
 * `mesh` is the object's name in the GLB; the position is **world-space**, not
 * `Object3D.position`. Several objects get reparented after load — every
 * inspectable ends up under an animated wrapper group with its own position
 * zeroed — so their local coordinates mean nothing outside that moment. World
 * space is the one frame of reference the editor and the loader share.
 * components/map/apply-mesh-overrides.ts converts back on the way in.
 */
export interface MeshOverride {
  mesh: string
  x?: number
  y?: number
  z?: number
  hidden?: boolean
  replacement?: MeshReplacement
}

export interface SceneEditorRequestMessage {
  type: typeof SCENE_EDITOR_REQUEST
  requestId: string
  action: SceneEditorAction
  /** `save` only: the complete override list, not a delta — it's `set` wholesale. */
  overrides?: MeshOverride[]
  file?: File
}

export const MAX_UPLOAD_BYTES = 64 * 1024 * 1024

/** Whether the document has draft edits waiting to go live. */
export interface SceneEditorStatus {
  hasUnpublishedChanges: boolean
}

export interface UploadedAsset {
  assetId: string
  url: string
}

export interface SceneEditorResultMessage {
  type: typeof SCENE_EDITOR_RESULT
  requestId: string
  ok: boolean
  /** Human-readable failure reason, surfaced next to the buttons. */
  error?: string
  /** Sent with every successful result, so the HUD never goes stale. */
  status?: SceneEditorStatus
  /** `upload` only. */
  asset?: UploadedAsset
}

export const isRequestMessage = (
  data: unknown
): data is SceneEditorRequestMessage => {
  if (typeof data !== "object" || data === null) return false
  const message = data as Partial<SceneEditorRequestMessage>
  return (
    message.type === SCENE_EDITOR_REQUEST &&
    typeof message.requestId === "string" &&
    (message.action === "save" ||
      message.action === "publish" ||
      message.action === "status" ||
      message.action === "upload")
  )
}

export const isResultMessage = (
  data: unknown
): data is SceneEditorResultMessage => {
  if (typeof data !== "object" || data === null) return false
  const message = data as Partial<SceneEditorResultMessage>
  return (
    message.type === SCENE_EDITOR_RESULT &&
    typeof message.requestId === "string" &&
    typeof message.ok === "boolean"
  )
}

/**
 * Reject anything that isn't a finite number before it reaches Sanity: a NaN
 * from a degenerate drag would serialize as `null` and come back as a position
 * of 0, teleporting the object to the origin.
 */
export const isValidOverride = (override: MeshOverride) => {
  if (typeof override?.mesh !== "string" || override.mesh.length === 0)
    return false

  const axes = [override.x, override.y, override.z]
  const given = axes.filter((n) => n !== undefined)
  if (given.length !== 0 && given.length !== 3) return false
  if (!given.every((n) => Number.isFinite(n))) return false

  if (override.hidden !== undefined && typeof override.hidden !== "boolean")
    return false

  const replacement = override.replacement
  if (replacement !== undefined) {
    if (
      typeof replacement?.assetId !== "string" ||
      replacement.assetId.length === 0
    )
      return false
    if (
      ![replacement.x, replacement.y, replacement.z].every((n) =>
        Number.isFinite(n)
      )
    )
      return false
  }

  return true
}

export const isMeaningfulOverride = (override: MeshOverride) =>
  override.x !== undefined ||
  override.hidden === true ||
  override.replacement !== undefined
