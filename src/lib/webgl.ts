// Inlined instead of three's WebGL.isWebGL2Available() to keep the Addons barrel
// out of the bundle. The probe context is released — contexts are a limited
// per-page resource.
export const isWebGL2Available = () => {
  try {
    const gl = document.createElement("canvas").getContext("webgl2")
    if (!gl) return false

    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}
