import { useEffect } from "react"
import { useState } from "react"

// Inlined instead of three's WebGL.isWebGL2Available() to keep the Addons barrel
// out of the bundle. The probe context is released — contexts are a limited
// per-page resource.
const isWebGL2Available = () => {
  try {
    if (!window.WebGL2RenderingContext) return false

    const gl = document.createElement("canvas").getContext("webgl2")
    if (!gl) return false

    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

export const useWebgl = () => {
  const [webglEnabled, setWebglEnabled] = useState(true)

  useEffect(() => {
    setWebglEnabled(isWebGL2Available())
  }, [])

  return webglEnabled
}
