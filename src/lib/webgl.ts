// Inlined instead of three's WebGL.isWebGL2Available() to keep the Addons barrel
// out of the bundle. The probe context is released — contexts are a limited
// per-page resource.
// Duplicated as an inline pre-paint script in src/app/layout.tsx (it must run
// before first paint and can't import modules) — keep the two in sync.
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
