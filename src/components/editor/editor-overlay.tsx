"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Object3D } from "three"

import { useAssets } from "@/components/assets-provider"
import type { IScene } from "@/components/navigation-handler/navigation.interface"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { cn } from "@/utils/cn"

import { isTypingTarget } from "./editor-keys"
import {
  type EditorCameraMode,
  type EditorMode,
  isAddedMesh,
  replacementTargetOf,
  useEditorStore
} from "./editor-store"
import { useSceneSave } from "./use-scene-save"

// Same visual language as the sitewide Human/Machine pill (see
// components/layout/mode-toggle.tsx): rounded pill, orange = active,
// white = clickable.
const pillClass =
  "pointer-events-auto flex items-center rounded-full border border-brand-g2 bg-brand-k font-mono text-f-p-mobile lg:text-f-p"
const segmentClass =
  "rounded-full px-3 py-1.5 uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-o"
const activeClass = "text-brand-o"
const inactiveClass = "text-brand-w1 transition-colors hover:text-brand-o"

const MODES: EditorMode[] = ["edit", "live"]
const CAMERA_MODES: EditorCameraMode[] = ["normal", "orbit"]

const disabledClass = "text-brand-g1 cursor-default"

/** How long the publish confirmation stays armed before disarming itself. */
const CONFIRM_WINDOW_MS = 4_000

type SceneSave = ReturnType<typeof useSceneSave>

/**
 * Save and Publish for objects edited with the gizmo, Delete and Replace.
 * Edit-mode only — live mode has none of those tools, so there's nothing to
 * commit.
 *
 * The two are separate on purpose, matching the rest of the Studio:
 *
 * - **save** writes the edits to the draft. The live site doesn't change,
 *   and the editor reads drafts, so you keep seeing your own work.
 * - **publish** promotes the draft, which is the step that goes live. It takes
 *   two clicks — the second one is labelled "sure?" — because it's the
 *   irreversible half and the HUD has no undo for it.
 *
 * Both writes happen in the Studio, one frame up; see use-scene-save.ts.
 */
const SaveControls = ({ scene }: { scene: SceneSave }) => {
  const {
    save,
    publish,
    action,
    status,
    error,
    unsavedCount,
    hasUnpublishedChanges,
    isEmbedded
  } = scene

  const [confirming, setConfirming] = useState(false)

  // Disarm on its own, so a stray click a minute later can't publish.
  useEffect(() => {
    if (!confirming) return
    const id = setTimeout(() => setConfirming(false), CONFIRM_WINDOW_MS)
    return () => clearTimeout(id)
  }, [confirming])

  const busy = status === "busy"
  const failed = status === "error"

  const saveDisabled = unsavedCount === 0 || busy
  const publishDisabled = !hasUnpublishedChanges || busy

  const saveLabel =
    action === "save" && busy
      ? "saving…"
      : action === "save" && status === "done"
        ? "saved"
        : unsavedCount > 0
          ? `save (${unsavedCount})`
          : "save"

  const publishLabel =
    action === "publish" && busy
      ? "publishing…"
      : action === "publish" && status === "done"
        ? "published"
        : confirming
          ? "sure?"
          : "publish"

  return (
    <div className="flex items-center gap-2">
      <div className={pillClass} role="group" aria-label="Save and publish">
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            save()
          }}
          disabled={saveDisabled}
          title={
            isEmbedded
              ? "Write the edited objects to the Map Assets Config draft"
              : "Only available inside the Studio's Editor tab"
          }
          className={cn(
            segmentClass,
            saveDisabled
              ? disabledClass
              : action === "save" && failed
                ? "text-brand-r2"
                : activeClass
          )}
        >
          {saveLabel}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!confirming) {
              setConfirming(true)
              return
            }
            setConfirming(false)
            publish()
          }}
          disabled={publishDisabled}
          title={
            hasUnpublishedChanges
              ? "Publish the Map Assets Config draft — this puts every change in it, not just the scene edits, on the live site"
              : "Nothing to publish"
          }
          className={cn(
            segmentClass,
            publishDisabled
              ? disabledClass
              : confirming || (action === "publish" && failed)
                ? "text-brand-r2"
                : inactiveClass
          )}
        >
          {publishLabel}
        </button>
      </div>

      {error ? (
        <p
          role="status"
          className="max-w-xs font-mono text-f-p-mobile text-brand-r2 lg:text-f-p"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * What to do with the object currently under the outline.
 *
 * Delete and Replace are both non-destructive to the model files: neither
 * touches a GLB, they write an entry keyed by mesh name that the site applies
 * after load (map/apply-mesh-overrides.ts), and both are reversible from
 * <RemovedList /> below. Like a gizmo drag, they don't reach the draft until
 * Save — the exception being Replace's upload, which has to happen up front to
 * get a URL the canvas can draw.
 */
const SelectionControls = ({
  picked,
  scene
}: {
  picked: Object3D
  scene: SceneSave
}) => {
  const deleteObject = useEditorStore((state) => state.deleteObject)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const { replace, action, status } = scene
  const uploading = action === "upload" && status === "busy"

  const name = replacementTargetOf(picked) ?? picked.name

  return (
    <div className={pillClass} role="group" aria-label="Selected object">
      <span className="px-3 py-1.5 text-brand-w1" title={name}>
        <span className="text-brand-g1">›</span>{" "}
        <span className="inline-block max-w-[16rem] truncate align-bottom">
          {name || "(unnamed)"}
        </span>
      </span>

      <button
        type="button"
        onClick={() => deleteObject(picked)}
        title={
          isAddedMesh(name)
            ? "Remove this model from the scene. It was added here, so there's nothing underneath to restore — you'd re-add the file."
            : "Take this object out of the scene. Reversible — it reappears under Removed."
        }
        className={cn(segmentClass, inactiveClass)}
      >
        delete
      </button>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        title="Upload a GLB to stand in this object's place"
        className={cn(segmentClass, uploading ? disabledClass : inactiveClass)}
      >
        {uploading ? "uploading…" : "replace…"}
      </button>

      <input
        ref={fileInput}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) replace(picked, file)
        }}
      />
    </div>
  )
}

const AddControl = ({ scene }: { scene: SceneSave }) => {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const { add, action, status } = scene
  const uploading = action === "upload" && status === "busy"

  return (
    <div className={pillClass}>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        title="Upload a GLB and drop it into the scene in front of the camera"
        className={cn(segmentClass, uploading ? disabledClass : inactiveClass)}
      >
        {uploading ? "uploading…" : "+ model"}
      </button>

      <input
        ref={fileInput}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Cleared so picking the same file twice still fires a change event.
          event.target.value = ""
          if (file) add(file)
        }}
      />
    </div>
  )
}

/** Objects that aren't in the scene right now, and what happened to them. */
const useRemovedMeshes = () => {
  const storedOverrides = useAssets().meshOverrides
  const edits = useEditorStore((state) => state.edits)

  return useMemo(() => {
    const stored = new Map(storedOverrides.map((o) => [o.mesh, o]))
    const removed = new Map<string, "deleted" | "replaced">()

    for (const [mesh, override] of stored) {
      if (isAddedMesh(mesh)) continue
      if (override.replacement) removed.set(mesh, "replaced")
      else if (override.hidden) removed.set(mesh, "deleted")
    }

    for (const [mesh, edit] of Object.entries(edits)) {
      if (isAddedMesh(mesh)) continue
      const base = stored.get(mesh)
      const replacement =
        edit.replacement !== undefined
          ? edit.replacement
          : (base?.replacement ?? null)
      const hidden = edit.hidden !== undefined ? edit.hidden : !!base?.hidden

      if (replacement) removed.set(mesh, "replaced")
      else if (hidden) removed.set(mesh, "deleted")
      else removed.delete(mesh)
    }

    return [...removed].map(([mesh, kind]) => ({ mesh, kind }))
  }, [edits, storedOverrides])
}

const RemovedList = () => {
  const removed = useRemovedMeshes()
  const restoreObject = useEditorStore((state) => state.restoreObject)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (removed.length === 0) setOpen(false)
  }, [removed.length])

  if (removed.length === 0) return null

  return (
    <div className="relative">
      <div className={pillClass}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(segmentClass, open ? activeClass : inactiveClass)}
        >
          removed ({removed.length})
        </button>
      </div>

      {open ? (
        <ul className="pointer-events-auto absolute left-1/2 top-full z-10 mt-1 max-h-64 w-64 -translate-x-1/2 overflow-y-auto rounded-md border border-brand-g2 bg-brand-k py-1 font-mono text-f-p-mobile lg:text-f-p">
          {removed.map(({ mesh, kind }) => (
            <li
              key={mesh}
              className="flex items-center justify-between gap-2 px-3 py-1"
            >
              <span
                className="min-w-0 flex-1 truncate text-brand-w1"
                title={mesh}
              >
                {mesh}
              </span>
              <span className="shrink-0 text-brand-g1">{kind}</span>
              <button
                type="button"
                onClick={() => restoreObject(mesh)}
                className={cn("shrink-0 uppercase", inactiveClass)}
              >
                restore
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * Editor-only HUD, top center. The Edit/Live switch is always visible; what sits
 * with it depends on the mode:
 *
 * - **live** — the site's real navbar instead, and the canvas is clickable. The
 *   scene switcher is redundant here because the navbar's own links cover the
 *   same ground.
 *
 * Neither path navigates. Both the scene switcher and the navbar's links end up
 * setting `currentScene` in the navigation store (the navbar via
 * `handleNavigation`, which short-circuits in the editor), because a real
 * router.push() out of /studio-scene crosses the (site) route-group boundary and
 * unmounts the WebGL tree — which does not survive a remount. Same reason
 * ModeToggle uses plain anchors instead of SPA links.
 *
 * `navbar` is a slot rather than an import: <Navbar /> is an async server
 * component (it fetches post/project counts), so it can't be conditionally
 * rendered from a client store. The server always renders it and this hides it.
 */
export const EditorOverlay = ({ navbar }: { navbar?: React.ReactNode }) => {
  const mode = useEditorStore((state) => state.mode)
  const setMode = useEditorStore((state) => state.setMode)
  const cameraMode = useEditorStore((state) => state.cameraMode)
  const setCameraMode = useEditorStore((state) => state.setCameraMode)
  const picked = useEditorStore((state) => state.pickedObject)
  const isLive = mode === "live"

  // One instance for the whole HUD: it owns the postMessage conversation with
  // the Studio, and a second copy would poll and answer in parallel, leaving
  // each with half the picture of what's been saved.
  const sceneSave = useSceneSave()

  const scenes = useAssets().scenes as IScene[]
  const currentScene = useNavigationStore((state) => state.currentScene)
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)

  useEffect(() => {
    if (isLive) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return
      if (isTypingTarget(event.target)) return
      const selected = useEditorStore.getState().pickedObject
      if (!selected) return
      event.preventDefault()
      useEditorStore.getState().deleteObject(selected)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isLive])

  // "home" first, everything else in Sanity's order — a scene added to
  // scenesConfig shows up here with no code change.
  const ordered = [...scenes].sort((a, b) =>
    a.name === "home" ? -1 : b.name === "home" ? 1 : 0
  )

  return (
    <>
      {/* Rendered outside the pointer-events-none wrapper below, and positioned
          by its own `fixed top-0 z-navbar`, so its links stay clickable. */}
      {isLive ? navbar : null}

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[1100] flex flex-col items-center gap-2 px-4",
          // Clear the navbar's 36px (h-9) strip when it's showing.
          isLive ? "pt-12" : "pt-4"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={pillClass} role="group" aria-label="Editor mode">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  segmentClass,
                  m === mode ? activeClass : inactiveClass
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Edit-mode only: live mode has to behave like the site, which means
              the scripted per-scene camera. */}
          {isLive ? null : (
            <div className={pillClass} role="group" aria-label="Camera">
              {CAMERA_MODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCameraMode(c)}
                  aria-pressed={cameraMode === c}
                  className={cn(
                    segmentClass,
                    c === cameraMode ? activeClass : inactiveClass
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {isLive ? null : <SaveControls scene={sceneSave} />}
        </div>

        {/* Edit mode only: with canvas interactions off, this is the only way
            to change scene. In live mode the navbar's links do the job. */}
        {isLive ? null : (
          <nav
            aria-label="Scene"
            className={cn(pillClass, "max-w-full flex-wrap justify-center")}
          >
            {ordered.map((scene) => {
              const isCurrent = currentScene?.name === scene.name
              return (
                <button
                  key={scene.name}
                  type="button"
                  onClick={() => setCurrentScene(scene)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    segmentClass,
                    isCurrent ? activeClass : inactiveClass
                  )}
                >
                  {scene.name}
                </button>
              )
            })}
          </nav>
        )}

        {isLive ? null : (
          <div className="flex items-start gap-2">
            {picked ? (
              <SelectionControls picked={picked} scene={sceneSave} />
            ) : null}
            <AddControl scene={sceneSave} />
            <RemovedList />
          </div>
        )}
      </div>
    </>
  )
}
