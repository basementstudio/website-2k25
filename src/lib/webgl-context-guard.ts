import * as Sentry from "@sentry/nextjs"
import type { WebGLRenderer } from "three"

let reported = false
let sawLostEvent = false

/** Whether the browser bothered to tell us, which is what we can't rely on. */
export const noteContextLostEvent = () => {
  sawLostEvent = true
}

// WebKit can leave the context dead without dispatching `webglcontextlost`, so
// three's own `_isContextLost` guard never arms. Sentry WEBSITE-2K25-4B.
// Called every frame, so the report stays one-shot.
export const reportIfContextLost = (gl: WebGLRenderer) => {
  if (!gl.getContext().isContextLost()) return false

  if (!reported) {
    reported = true
    Sentry.captureMessage("WebGL context lost", {
      level: "warning",
      extra: { viaEvent: sawLostEvent }
    })
  }

  return true
}
