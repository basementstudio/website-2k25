import { useThree } from "@react-three/fiber"
import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import {
  noteContextLostEvent,
  reportIfContextLost
} from "@/lib/webgl-context-guard"

// three restores itself, so wait before tearing down: `canvasUnavailable` is
// one-way and pushes users off /lab.
const RESTORE_GRACE_MS = 5_000
const POLL_MS = 1_000

export const WebGLContextGuard = () => {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const canvas = gl.domElement

    // Telemetry only, and no preventDefault() — three's listener already calls
    // it to ask for a restore.
    canvas.addEventListener("webglcontextlost", noteContextLostEvent)

    // Polled rather than driven by the event, because WebKit can kill the
    // context without firing it and leave a frozen canvas up forever.
    let lostTicks = 0
    const poll = setInterval(() => {
      if (!reportIfContextLost(gl)) {
        lostTicks = 0
        return
      }

      if (++lostTicks * POLL_MS < RESTORE_GRACE_MS) return

      clearInterval(poll)
      useAppLoadingStore.getState().reportCanvasUnavailable()
    }, POLL_MS)

    if (process.env.NODE_ENV !== "production") {
      const ext = gl.getContext().getExtension("WEBGL_lose_context")

      Object.assign(window, {
        __loseContext: () => ext?.loseContext(),
        __restoreContext: () => ext?.restoreContext()
      })
    }

    return () => {
      clearInterval(poll)
      canvas.removeEventListener("webglcontextlost", noteContextLostEvent)
    }
  }, [gl])

  return null
}
