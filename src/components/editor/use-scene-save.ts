"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Object3D } from "three"

import { useAssets } from "@/components/assets-provider"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import {
  isMeaningfulOverride,
  isResultMessage,
  type MeshOverride,
  SCENE_EDITOR_REQUEST,
  type SceneEditorAction,
  type SceneEditorRequestMessage,
  type SceneEditorResultMessage
} from "@/lib/scene-editor-bridge"

import { addedMeshKey, unsavedEditCount, useEditorStore } from "./editor-store"
import {
  dropPointInFrontOfCamera,
  selectionCenterArray
} from "./selection-center"

export type SceneEditorStatus = "idle" | "busy" | "done" | "error"

/** How long to wait for the Studio tool's reply before calling it a failure. */
const REQUEST_TIMEOUT_MS = 20_000

/** Uploads move real files over the wire, so they get their own, longer leash. */
const UPLOAD_TIMEOUT_MS = 180_000

/** How long a button sits on its success label before returning to normal. */
const DONE_FLASH_MS = 2_000

let requestCounter = 0

interface PendingRequest {
  resolve: (result: SceneEditorResultMessage) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export const useSceneSave = () => {
  const storedOverrides = useAssets().meshOverrides
  const edits = useEditorStore((state) => state.edits)
  const markEditsSaved = useEditorStore((state) => state.markEditsSaved)
  const replaceObject = useEditorStore((state) => state.replaceObject)
  const addObject = useEditorStore((state) => state.addObject)
  const camera = useNavigationStore((state) => state.mainCamera)
  const unsavedCount = useEditorStore(unsavedEditCount)

  const [action, setAction] = useState<SceneEditorAction | null>(null)
  const [status, setStatus] = useState<SceneEditorStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)

  const pending = useRef(new Map<string, PendingRequest>())
  const doneTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Saving is only meaningful inside the Studio's Editor tool — the parent
   * frame is what holds the Sanity client. Opening /studio-scene directly
   * (handy for debugging the canvas) has no one to post to.
   */
  const [isEmbedded, setIsEmbedded] = useState(false)
  useEffect(() => setIsEmbedded(window.parent !== window), [])

  const request = useCallback(
    (
      nextAction: SceneEditorAction,
      payload?: { overrides?: MeshOverride[]; file?: File }
    ) =>
      new Promise<SceneEditorResultMessage>((resolve, reject) => {
        const requestId = `${nextAction}-${++requestCounter}`
        const timer = setTimeout(
          () => {
            pending.current.delete(requestId)
            reject(new Error("The Studio didn't respond. Try again."))
          },
          nextAction === "upload" ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
        )
        pending.current.set(requestId, { resolve, reject, timer })

        const message: SceneEditorRequestMessage = {
          type: SCENE_EDITOR_REQUEST,
          requestId,
          action: nextAction,
          overrides: payload?.overrides,
          file: payload?.file
        }
        window.parent.postMessage(message, window.location.origin)
      }),
    []
  )

  useEffect(() => {
    const inFlight = pending.current

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== window.parent) return
      if (!isResultMessage(event.data)) return

      const entry = inFlight.get(event.data.requestId)
      if (!entry) return
      inFlight.delete(event.data.requestId)
      clearTimeout(entry.timer)

      if (event.data.status) {
        setHasUnpublishedChanges(event.data.status.hasUnpublishedChanges)
      }

      if (event.data.ok) entry.resolve(event.data)
      else entry.reject(new Error(event.data.error ?? "Something went wrong."))
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
      inFlight.forEach((entry) => clearTimeout(entry.timer))
      inFlight.clear()
    }
  }, [])

  const withStatus = useCallback(
    async (nextAction: SceneEditorAction, run: () => Promise<void>) => {
      if (doneTimeoutId.current) clearTimeout(doneTimeoutId.current)
      setAction(nextAction)
      setError(null)
      setStatus("busy")
      try {
        await run()
        setStatus("done")
        doneTimeoutId.current = setTimeout(
          () => setStatus("idle"),
          DONE_FLASH_MS
        )
      } catch (thrown) {
        setError(
          thrown instanceof Error ? thrown.message : "Something went wrong."
        )
        setStatus("error")
      }
    },
    []
  )

  useEffect(() => {
    if (!isEmbedded) return
    request("status").catch(() => {})
  }, [isEmbedded, request])

  useEffect(
    () => () => {
      if (doneTimeoutId.current) clearTimeout(doneTimeoutId.current)
    },
    []
  )

  const notEmbedded = useCallback(() => {
    setAction(null)
    setError("Open this from the Studio's Editor tab.")
    setStatus("error")
  }, [])

  const buildOverrides = useCallback((): MeshOverride[] => {
    const merged = new Map<string, MeshOverride>()

    for (const stored of storedOverrides) {
      merged.set(stored.mesh, {
        mesh: stored.mesh,
        ...(stored.position
          ? {
              x: stored.position[0],
              y: stored.position[1],
              z: stored.position[2]
            }
          : {}),
        ...(stored.hidden ? { hidden: true } : {}),
        ...(stored.replacement
          ? {
              replacement: {
                assetId: stored.replacement.assetId,
                x: stored.replacement.position[0],
                y: stored.replacement.position[1],
                z: stored.replacement.position[2]
              }
            }
          : {})
      })
    }

    for (const [mesh, edit] of Object.entries(edits)) {
      const next: MeshOverride = { ...(merged.get(mesh) ?? { mesh }) }

      if (edit.position) {
        next.x = edit.position[0]
        next.y = edit.position[1]
        next.z = edit.position[2]
      }
      if (edit.hidden !== undefined) {
        if (edit.hidden) next.hidden = true
        else delete next.hidden
      }
      if (edit.replacement !== undefined) {
        if (edit.replacement) {
          next.replacement = {
            assetId: edit.replacement.assetId,
            x: edit.replacement.position[0],
            y: edit.replacement.position[1],
            z: edit.replacement.position[2]
          }
        } else {
          delete next.replacement
        }
      }

      merged.set(mesh, next)
    }

    return [...merged.values()].filter(isMeaningfulOverride)
  }, [edits, storedOverrides])

  const save = useCallback(() => {
    if (unsavedCount === 0 || status === "busy") return
    if (!isEmbedded) return notEmbedded()

    const committed = { ...edits }

    return withStatus("save", async () => {
      await request("save", { overrides: buildOverrides() })
      markEditsSaved(committed)
    })
  }, [
    buildOverrides,
    edits,
    isEmbedded,
    markEditsSaved,
    notEmbedded,
    request,
    status,
    unsavedCount,
    withStatus
  ])

  const publish = useCallback(() => {
    if (status === "busy") return
    if (!isEmbedded) return notEmbedded()
    return withStatus("publish", async () => {
      await request("publish")
    })
  }, [isEmbedded, notEmbedded, request, status, withStatus])

  const replace = useCallback(
    (object: Object3D, file: File) => {
      if (status === "busy") return
      if (!isEmbedded) return notEmbedded()

      const position = selectionCenterArray(object)

      return withStatus("upload", async () => {
        const result = await request("upload", { file })
        if (!result.asset) {
          throw new Error("The upload came back without a file. Try again.")
        }
        replaceObject(object, { ...result.asset, position })
      })
    },
    [isEmbedded, notEmbedded, replaceObject, request, status, withStatus]
  )

  const add = useCallback(
    (file: File) => {
      if (status === "busy") return
      if (!isEmbedded) return notEmbedded()

      const position = dropPointInFrontOfCamera(camera)
      const mesh = addedMeshKey(file.name)

      return withStatus("upload", async () => {
        const result = await request("upload", { file })
        if (!result.asset) {
          throw new Error("The upload came back without a file. Try again.")
        }
        addObject(mesh, { ...result.asset, position })
      })
    },
    [addObject, camera, isEmbedded, notEmbedded, request, status, withStatus]
  )

  return {
    save,
    publish,
    replace,
    add,
    action,
    status,
    error,
    unsavedCount,
    hasUnpublishedChanges,
    isEmbedded
  }
}
