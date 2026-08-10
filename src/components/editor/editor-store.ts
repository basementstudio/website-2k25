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

interface EditorState {
  /** True only on /studio-scene — the canvas host for the Studio's Editor tool. */
  isEditor: boolean
  mode: EditorMode
  cameraMode: EditorCameraMode
  /** Mesh picked by the edit-mode raycast, outlined in orange. */
  pickedObject: Object3D | null
  /**
   * Every object moved this session, keyed by mesh name — the same key the
   * stored overrides use, so this is a straight overlay on top of them.
   *
   * Deliberately never cleared, including by a successful save. A save writes
   * the whole override array at once, so the second save of a session has to
   * resend the first save's objects too; dropping them here would silently
   * revert them.
   */
  movedObjects: Record<string, WorldPosition>
  /**
   * The subset of `movedObjects` already written to the draft, as it was
   * written. Anything in `movedObjects` that differs from its entry here is
   * what "unsaved" means — see `unsavedMoveCount`.
   */
  savedMoves: Record<string, WorldPosition>
  setIsEditor: (isEditor: boolean) => void
  setMode: (mode: EditorMode) => void
  setCameraMode: (cameraMode: EditorCameraMode) => void
  setPickedObject: (pickedObject: Object3D | null) => void
  /** Record where an object ended up. Called on gizmo drag end and on undo. */
  recordMove: (object: Object3D) => void
  /**
   * Called with the exact snapshot a save committed — not with the current
   * `movedObjects`, which may have grown while the request was in flight.
   */
  markMovesSaved: (moves: Record<string, WorldPosition>) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  isEditor: false,
  // The editor opens in "edit": the scene is for looking at, not clicking.
  mode: "edit",
  cameraMode: "normal",
  pickedObject: null,
  movedObjects: {},
  savedMoves: {},
  setIsEditor: (isEditor) => set({ isEditor }),
  // Changing mode drops the selection — the outline is an edit-mode affordance.
  // cameraMode is deliberately kept, so switching edit → live → edit restores
  // the orbit cam you were using.
  setMode: (mode) => set({ mode, pickedObject: null }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setPickedObject: (pickedObject) => set({ pickedObject }),
  recordMove: (object) =>
    set((state) => {
      // Overrides are matched to objects by name (see
      // map/apply-mesh-overrides.ts), so an unnamed one can't be persisted.
      // Nothing in the shipped GLBs hits this; the guard is here so a nameless
      // object fails loudly at drag time rather than silently at save time.
      if (!object.name) {
        console.warn(
          "[editor] moved an object with no name — it can't be saved.",
          object
        )
        return state
      }
      // getWorldPosition refreshes the ancestor chain itself, so this is
      // correct even mid-animation — see WorldPosition for why local won't do.
      const world = object.getWorldPosition(new Vector3())
      return {
        movedObjects: {
          ...state.movedObjects,
          [object.name]: [world.x, world.y, world.z]
        }
      }
    }),
  markMovesSaved: (moves) =>
    set((state) => ({ savedMoves: { ...state.savedMoves, ...moves } }))
}))

const samePosition = (a: WorldPosition, b: WorldPosition | undefined) =>
  !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

/** How many moved objects haven't been written to the draft yet. */
export const unsavedMoveCount = (
  state: Pick<EditorState, "movedObjects" | "savedMoves">
) =>
  Object.entries(state.movedObjects).filter(
    ([mesh, position]) => !samePosition(position, state.savedMoves[mesh])
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
