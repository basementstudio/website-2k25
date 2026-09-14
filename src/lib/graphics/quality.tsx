import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { create } from "zustand"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { recordGraphicsTiming } from "./telemetry"

export const useGraphicsQuality = create<{ effects: boolean }>(() => ({
  effects: true
}))

/** Windows exclude startup/resume stalls; asymmetric thresholds avoid oscillation. */
export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr)
  const stats = useRef({
    samples: [] as number[],
    elapsed: 0,
    good: 0,
    lastChange: 0,
    lastSample: 0,
    ceiling: Infinity,
    retryAfter: 0,
    sampled: Math.random() < 0.01
  })
  useFrame((state, delta) => {
    if (process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1") return
    if (
      !useAppLoadingStore.getState().hasPresentedFrame ||
      document.hidden ||
      useNavigationStore.getState().isCameraTransitioning ||
      delta > 0.25
    )
      return
    const data = stats.current
    data.samples.push(delta * 1000)
    data.elapsed += delta
    if (data.elapsed < 2) return
    const sorted = data.samples.sort((a, b) => a - b)
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const mobile = state.size.width < 1024
    const budget = mobile ? 33.34 : 16.67
    const now = performance.now()
    data.samples = []
    data.elapsed = 0
    if (data.sampled && now - data.lastSample > 30000) {
      data.lastSample = now
      recordGraphicsTiming("frame-window", 2000, {
        p95Ms: p95,
        backend: state.gl.domElement.dataset.backend ?? "unknown",
        dpr: state.viewport.dpr,
        effects: useGraphicsQuality.getState().effects
      })
    }
    if (now - data.lastChange < 6000) return
    if (p95 > budget * 1.15) {
      data.good = 0
      data.lastChange = now
      if (useGraphicsQuality.getState().effects)
        useGraphicsQuality.setState({ effects: false })
      else {
        data.ceiling = Math.max(0.75, state.viewport.dpr - 0.25)
        data.retryAfter = now + 60000
        setDpr(data.ceiling)
      }
    } else if (p95 < budget * 0.8) {
      if (++data.good < 4) return
      data.good = 0
      data.lastChange = now
      const cap = Math.min(
        mobile ? 1 : Math.min(2, window.devicePixelRatio),
        now < data.retryAfter ? data.ceiling : Infinity
      )
      if (state.viewport.dpr < cap)
        setDpr(Math.min(cap, state.viewport.dpr + 0.25))
      else useGraphicsQuality.setState({ effects: true })
    } else data.good = 0
  })
  return null
}
