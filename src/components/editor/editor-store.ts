"use client"

import { type Object3D, Vector3 } from "three"
import { create } from "zustand"

export type EditorMode = "edit" | "live"
/** "normal" = the site's scripted per-scene camera; "orbit" = free orbit cam. */
export type EditorCameraMode = "normal" | "orbit"

/**
 * A **world**-space position.
 *
 * Not `Object3D.position`, which is local to whatever the object's parent
 * happens to be at that moment — and for several objects here that parent isn't
 * the GLB root the site loads. The clearest case is inspectables: <Inspectable>
 * reparents the mesh under an animated wrapper group and zeroes the mesh's own
 * position (inspectables/inspectable.tsx), so a gizmo drag produces an offset
 * from zero, meaningless anywhere else. World space is the one frame of
 * reference both the editor and the loader agree on, and it's also what the
 * person dragging is actually looking at.
 */
export type WorldPosition = [number, number, number]

export interface MeshReplacementEdit {
  assetId: string
  url: string
  position: WorldPosition
}

export interface MeshEdit {
  position?: WorldPosition
  hidden?: boolean
  replacement?: MeshReplacementEdit | null
}

const editableObjects = new Map<string, Object3D>()

export const registerEditableObject = (object: Object3D) => {
  if (object.name) editableObjects.set(object.name, object)
}

export const getEditableObject = (name: string) => editableObjects.get(name)

export const REPLACEMENT_TAG = "editorReplacementFor"

export const replacementTargetOf = (object: Object3D): string | null => {
  const target = object.userData?.[REPLACEMENT_TAG]
  return typeof target === "string" ? target : null
}

export const REPLACEMENT_ASSET_TAG = "editorReplacementAsset"

export const replacementAssetOf = (
  object: Object3D
): { assetId: string; url: string } | null => {
  const asset = object.userData?.[REPLACEMENT_ASSET_TAG]
  return typeof asset?.assetId === "string" && typeof asset?.url === "string"
    ? { assetId: asset.assetId, url: asset.url }
    : null
}

export const ADDED_MESH_PREFIX = "added-"

export const isAddedMesh = (mesh: string) => mesh.startsWith(ADDED_MESH_PREFIX)

/** A key for a newly added model, readable enough to find in the Studio form. */
export const addedMeshKey = (filename: string) => {
  const slug =
    filename
      .replace(/\.(glb|gltf)$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "model"
  return `${ADDED_MESH_PREFIX}${slug}-${crypto.randomUUID().slice(0, 8)}`
}

interface EditorState {
  /** True only on /studio-scene — the canvas host for the Studio's Editor tool. */
  isEditor: boolean
  mode: EditorMode
  cameraMode: EditorCameraMode
  /** Mesh picked by the edit-mode raycast, outlined in orange. */
  pickedObject: Object3D | null
  /**
   * Every object edited this session, keyed by mesh name — the same key the
   * stored overrides use, so this is a straight overlay on top of them.
   *
   * Deliberately never cleared, including by a successful save. A save writes
   * the whole override array at once, so the second save of a session has to
   * resend the first save's objects too; dropping them here would silently
   * revert them.
   */
  edits: Record<string, MeshEdit>
  /**
   * The subset of `edits` already written to the draft, as it was written.
   * Anything in `edits` that differs from its entry here is what "unsaved"
   * means — see `unsavedEditCount`.
   */
  savedEdits: Record<string, MeshEdit>
  setIsEditor: (isEditor: boolean) => void
  setMode: (mode: EditorMode) => void
  setCameraMode: (cameraMode: EditorCameraMode) => void
  setPickedObject: (pickedObject: Object3D | null) => void
  /** Record where an object ended up. Called on gizmo drag end and on undo. */
  recordMove: (object: Object3D) => void
  deleteObject: (object: Object3D) => void
  replaceObject: (object: Object3D, replacement: MeshReplacementEdit) => void
  addObject: (mesh: string, replacement: MeshReplacementEdit) => void
  restoreObject: (mesh: string) => void
  markEditsSaved: (edits: Record<string, MeshEdit>) => void
}

const worldPositionOf = (object: Object3D): WorldPosition => {
  const world = object.getWorldPosition(new Vector3())
  return [world.x, world.y, world.z]
}

export const useEditorStore = create<EditorState>((set) => ({
  isEditor: false,
  mode: "edit",
  cameraMode: "normal",
  pickedObject: null,
  edits: {},
  savedEdits: {},
  setIsEditor: (isEditor) => set({ isEditor }),
  // Changing mode drops the selection — the outline is an edit-mode affordance.
  // cameraMode is deliberately kept, so switching edit → live → edit restores
  // the orbit cam you were using.
  setMode: (mode) => set({ mode, pickedObject: null }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setPickedObject: (pickedObject) => set({ pickedObject }),

  recordMove: (object) =>
    set((state) => {
      const replacementTarget = replacementTargetOf(object)
      const mesh = replacementTarget ?? object.name

      // Overrides are matched to objects by name (see
      // map/apply-mesh-overrides.ts), so an unnamed one can't be persisted.
      // Nothing in the shipped GLBs hits this; the guard is here so a nameless
      // object fails loudly at drag time rather than silently at save time.
      if (!mesh) {
        console.warn(
          "[editor] moved an object with no name — it can't be saved.",
          object
        )
        return state
      }

      const previous = state.edits[mesh]
      const position = worldPositionOf(object)

      if (replacementTarget) {
        const replacement = previous?.replacement ?? replacementAssetOf(object)
        if (!replacement) {
          console.warn(
            `[editor] moved a replacement for "${replacementTarget}" with no file attached — it can't be saved.`,
            object
          )
          return state
        }
        return {
          edits: {
            ...state.edits,
            [mesh]: { ...previous, replacement: { ...replacement, position } }
          }
        }
      }

      return { edits: { ...state.edits, [mesh]: { ...previous, position } } }
    }),

  deleteObject: (object) =>
    set((state) => {
      const replacementTarget = replacementTargetOf(object)
      const mesh = replacementTarget ?? object.name
      if (!mesh) {
        console.warn(
          "[editor] deleted an object with no name — it can't be saved.",
          object
        )
        return state
      }

      if (replacementTarget) {
        return {
          pickedObject: null,
          edits: {
            ...state.edits,
            [mesh]: {
              ...state.edits[mesh],
              hidden: !isAddedMesh(mesh),
              replacement: null
            }
          }
        }
      }

      object.visible = false
      registerEditableObject(object)

      return {
        pickedObject: null,
        edits: {
          ...state.edits,
          [mesh]: { ...state.edits[mesh], hidden: true }
        }
      }
    }),

  replaceObject: (object, replacement) =>
    set((state) => {
      const mesh = replacementTargetOf(object) ?? object.name
      if (!mesh) {
        console.warn(
          "[editor] replaced an object with no name — it can't be saved.",
          object
        )
        return state
      }

      const original = replacementTargetOf(object)
        ? getEditableObject(mesh)
        : object
      if (original) {
        original.visible = false
        registerEditableObject(original)
      }

      return {
        pickedObject: null,
        edits: {
          ...state.edits,
          [mesh]: { ...state.edits[mesh], replacement }
        }
      }
    }),

  addObject: (mesh, replacement) =>
    set((state) => ({
      pickedObject: null,
      edits: { ...state.edits, [mesh]: { replacement } }
    })),

  restoreObject: (mesh) =>
    set((state) => {
      const object = getEditableObject(mesh)
      if (object) object.visible = true

      return {
        pickedObject: null,
        edits: {
          ...state.edits,
          [mesh]: { ...state.edits[mesh], hidden: false, replacement: null }
        }
      }
    }),

  markEditsSaved: (edits) =>
    set((state) => ({ savedEdits: { ...state.savedEdits, ...edits } }))
}))

const samePosition = (
  a: WorldPosition | null | undefined,
  b: WorldPosition | null | undefined
) => (!a || !b ? !a === !b : a[0] === b[0] && a[1] === b[1] && a[2] === b[2])

const sameReplacement = (
  a: MeshReplacementEdit | null | undefined,
  b: MeshReplacementEdit | null | undefined
) =>
  !a || !b
    ? !a === !b
    : a.assetId === b.assetId && samePosition(a.position, b.position)

const sameEdit = (a: MeshEdit = {}, b: MeshEdit = {}) =>
  samePosition(a.position, b.position) &&
  a.hidden === b.hidden &&
  "replacement" in a === "replacement" in b &&
  sameReplacement(a.replacement, b.replacement)

export const unsavedEditCount = (
  state: Pick<EditorState, "edits" | "savedEdits">
) =>
  Object.entries(state.edits).filter(
    ([mesh, edit]) => !sameEdit(edit, state.savedEdits[mesh])
  ).length

/**
 * The orbit cam is an edit-mode tool only: live mode must behave like the site,
 * so it always uses the scripted camera regardless of the stored cameraMode.
 */
export const orbitCameraActive = (
  state: Pick<EditorState, "isEditor" | "mode" | "cameraMode">
) => state.isEditor && state.mode === "edit" && state.cameraMode === "orbit"

export const useOrbitCameraActive = () => useEditorStore(orbitCameraActive)

/**
 * Whether the canvas's interactive layer is live — inspectable pick/zoom and
 * routing-element hover labels ("[go to people]") plus their clicks.
 *
 * Off only in the editor's "edit" mode, so the scene can be framed and reviewed
 * without the site's interaction layer intercepting the pointer. On the real
 * site `isEditor` is false, so this is always true and nothing changes.
 */
export const interactionsEnabled = (
  state: Pick<EditorState, "isEditor" | "mode">
) => !(state.isEditor && state.mode === "edit")

export const useInteractionsEnabled = () => useEditorStore(interactionsEnabled)
