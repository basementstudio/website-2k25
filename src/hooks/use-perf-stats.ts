import { create } from "zustand"

interface PerfStatsState {
  calls: number
  triangles: number
  geometries: number
  textures: number
}

/** Bridges renderer stats — read from gl.info right after the main scene's
 * render() call in src/components/postprocessing/renderer.tsx, before the
 * CCTV/postprocessing render() calls reset gl.info.render.* again — out to
 * the DOM-side debug panel (perf-stats-panel.tsx). */
export const usePerfStats = create<PerfStatsState>(() => ({
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0
}))
