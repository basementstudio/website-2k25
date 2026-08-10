"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import {
  isResultMessage,
  type MeshOverride,
  SCENE_EDITOR_REQUEST,
  type SceneEditorAction,
  type SceneEditorRequestMessage
} from "@/lib/scene-editor-bridge"

import {
  unsavedMoveCount,
  useEditorStore,
  type WorldPosition
} from "./editor-store"

export type SceneEditorStatus = "idle" | "busy" | "done" | "error"

/** How long to wait for the Studio tool's reply before calling it a failure. */
const REQUEST_TIMEOUT_MS = 20_000

/** How long a button sits on its success label before returning to normal. */
const DONE_FLASH_MS = 2_000

let requestCounter = 0

/**
 * Drives the editor's Save and Publish buttons.
 *
 * Both writes happen in the Studio (sanity/studio/scene-editor-tool.tsx), which
 * owns an authenticated client; this side assembles the payload and posts it to
 * the parent frame. See lib/scene-editor-bridge.ts for why.
 *
 * Save's payload is the **complete** override list — the overrides already in
 * the document, with every object moved this session laid over them — not a
 * delta, because the tool `set`s the array wholesale.
 */
export const useSceneSave = () => {
  const storedOverrides = useAssets().meshOverrides
  const movedObjects = useEditorStore((state) => state.movedObjects)
  const markMovesSaved = useEditorStore((state) => state.markMovesSaved)
  const unsavedCount = useEditorStore(unsavedMoveCount)

  const [action, setAction] = useState<SceneEditorAction | null>(null)
  const [status, setStatus] = useState<SceneEditorStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)

  // Only the request we're currently waiting on may resolve the buttons.
  const pending = useRef<{
    id: string
    action: SceneEditorAction
    /** Save only: the exact moves sent, marked saved once the reply lands. */
    moves?: Record<string, WorldPosition>
  } | null>(null)
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Saving is only meaningful inside the Studio's Editor tool — the parent
   * frame is what holds the Sanity client. Opening /studio-scene directly
   * (handy for debugging the canvas) has no one to post to.
   */
  const [isEmbedded, setIsEmbedded] = useState(false)
  useEffect(() => setIsEmbedded(window.parent !== window), [])

  const send = useCallback(
    (
      nextAction: SceneEditorAction,
      payload?: {
        overrides: MeshOverride[]
        moves: Record<string, WorldPosition>
      }
    ) => {
      const requestId = `${nextAction}-${++requestCounter}`
      pending.current = {
        id: requestId,
        action: nextAction,
        moves: payload?.moves
      }

      if (timeoutId.current) clearTimeout(timeoutId.current)
      if (doneTimeoutId.current) clearTimeout(doneTimeoutId.current)
      setError(null)
      // A background status poll shouldn't put the buttons in a busy state.
      if (nextAction !== "status") {
        setAction(nextAction)
        setStatus("busy")
      }

      const message: SceneEditorRequestMessage = {
        type: SCENE_EDITOR_REQUEST,
        requestId,
        action: nextAction,
        overrides: payload?.overrides
      }
      window.parent.postMessage(message, window.location.origin)

      timeoutId.current = setTimeout(() => {
        pending.current = null
        if (nextAction === "status") return
        setError("The Studio didn't respond. Try again.")
        setStatus("error")
      }, REQUEST_TIMEOUT_MS)
    },
    []
  )

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== window.parent) return
      if (!isResultMessage(event.data)) return

      const inFlight = pending.current
      if (!inFlight || event.data.requestId !== inFlight.id) return
      pending.current = null
      if (timeoutId.current) clearTimeout(timeoutId.current)

      if (event.data.status) {
        setHasUnpublishedChanges(event.data.status.hasUnpublishedChanges)
      }

      if (!event.data.ok) {
        if (inFlight.action === "status") return
        setError(event.data.error ?? "Something went wrong.")
        setStatus("error")
        return
      }

      // The moves are in the draft now, so they stop counting as unsaved.
      if (inFlight.moves) markMovesSaved(inFlight.moves)
      if (inFlight.action === "status") return

      setStatus("done")
      doneTimeoutId.current = setTimeout(() => setStatus("idle"), DONE_FLASH_MS)
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [markMovesSaved])

  // Ask once on mount whether a draft is already waiting, so Publish is
  // enabled for work saved in an earlier session.
  useEffect(() => {
    if (!isEmbedded) return
    send("status")
  }, [isEmbedded, send])

  // Don't leave timers running past unmount — they'd setState on a dead
  // component and, worse, could flip a write that landed to "error".
  useEffect(
    () => () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
      if (doneTimeoutId.current) clearTimeout(doneTimeoutId.current)
    },
    []
  )

  const notEmbedded = useCallback(() => {
    setError("Open this from the Studio's Editor tab.")
    setStatus("error")
  }, [])

  const save = useCallback(() => {
    if (unsavedCount === 0 || status === "busy") return
    if (!isEmbedded) return notEmbedded()

    // Stored overrides first, so a move made this session wins over the
    // position already in the document for the same mesh.
    const merged = new Map<string, MeshOverride>()
    for (const { mesh, position } of storedOverrides) {
      merged.set(mesh, { mesh, x: position[0], y: position[1], z: position[2] })
    }
    for (const [mesh, [x, y, z]] of Object.entries(movedObjects)) {
      merged.set(mesh, { mesh, x, y, z })
    }

    send("save", {
      overrides: [...merged.values()],
      // Snapshot: movedObjects can grow while the request is in flight, and
      // only what actually went out may be marked saved.
      moves: { ...movedObjects }
    })
  }, [
    isEmbedded,
    movedObjects,
    notEmbedded,
    send,
    status,
    storedOverrides,
    unsavedCount
  ])

  const publish = useCallback(() => {
    if (status === "busy") return
    if (!isEmbedded) return notEmbedded()
    send("publish")
  }, [isEmbedded, notEmbedded, send, status])

  return {
    save,
    publish,
    /** Which button is mid-request (or last errored); null when idle. */
    action,
    status,
    error,
    unsavedCount,
    hasUnpublishedChanges,
    isEmbedded
  }
}
