"use client"

import { useEffect, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import type { IScene } from "@/components/navigation-handler/navigation.interface"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { cn } from "@/utils/cn"

import {
  type EditorCameraMode,
  type EditorMode,
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

/**
 * Save and Publish for objects moved with the gizmo. Edit-mode only — live mode
 * has no gizmo, so there's nothing to commit.
 *
 * The two are separate on purpose, matching the rest of the Studio:
 *
 * - **save** writes the positions to the draft. The live site doesn't change,
 *   and the editor reads drafts, so you keep seeing your own work.
 * - **publish** promotes the draft, which is the step that goes live. It takes
 *   two clicks — the second one is labelled "sure?" — because it's the
 *   irreversible half and the HUD has no undo for it.
 *
 * Both writes happen in the Studio, one frame up; see use-scene-save.ts.
 */
const SaveControls = () => {
  const {
    save,
    publish,
    action,
    status,
    error,
    unsavedCount,
    hasUnpublishedChanges,
    isEmbedded
  } = useSceneSave()

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
              ? "Write the moved objects to the Map Assets Config draft"
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
              ? "Publish the Map Assets Config draft — this puts every change in it, not just positions, on the live site"
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
 * Editor-only HUD, top center. The Edit/Live switch is always visible; what sits
 * with it depends on the mode:
 *
 * - **edit** — the scene switcher pill. Canvas interactions are off, so this is
 *   the only way to move between scenes.
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
  const isLive = mode === "live"

  const scenes = useAssets().scenes as IScene[]
  const currentScene = useNavigationStore((state) => state.currentScene)
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)

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

          {/* Edit-mode only, for the same reason: the gizmo that produces
              something to save is an edit-mode tool. */}
          {isLive ? null : <SaveControls />}
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
      </div>
    </>
  )
}
