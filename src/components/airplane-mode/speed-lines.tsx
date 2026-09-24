"use client"

import { useEffect, useRef } from "react"

import { flightFx, useAirplaneStore } from "./store"

// Anime/cartoon speed lines while boosting: thin white wedges converging on
// the screen center, each fading out toward it (its own linear gradient), and
// re-rolled every REFRESH_MS so they flicker like hand-drawn streaks. Faded
// in and out with flightFx.boost (eased in flight.tsx), so they never cut.

const LINE_COUNT = 56
const REFRESH_MS = 55
// Nico: halved from 0.65.
const MAX_ALPHA = 0.325
// Inner end of each line, as a fraction of the distance from the center to
// the screen edge along that line's angle — so lines reach in the same
// amount on the short (top/bottom) sides as on the long ones.
const INNER_MIN = 0.45
const INNER_MAX = 0.8
// Outer width of each wedge in CSS px.
const WIDTH_MIN = 2
const WIDTH_MAX = 11
const MAX_DPR = 1.5

interface Line {
  angle: number
  inner: number
  width: number
  alpha: number
}

const rollLines = (lines: Line[]) => {
  for (let i = 0; i < LINE_COUNT; i++) {
    lines[i] = {
      angle: ((i + Math.random() * 0.8) / LINE_COUNT) * Math.PI * 2,
      inner: INNER_MIN + Math.random() * (INNER_MAX - INNER_MIN),
      width: WIDTH_MIN + Math.random() * (WIDTH_MAX - WIDTH_MIN),
      alpha: 0.35 + Math.random() * 0.65
    }
  }
}

export function SpeedLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lines: Line[] = []
    rollLines(lines)
    let lastRoll = 0
    let wasVisible = false
    let frame = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)
      const boost =
        useAirplaneStore.getState().phase === "flying" ? flightFx.boost : 0
      const { width, height } = canvas
      if (boost < 0.01) {
        if (wasVisible) ctx.clearRect(0, 0, width, height)
        wasVisible = false
        return
      }
      wasVisible = true
      if (now - lastRoll > REFRESH_MS) {
        rollLines(lines)
        lastRoll = now
      }

      const dpr = width / window.innerWidth
      const cx = width / 2
      const cy = height / 2
      const radius = Math.hypot(cx, cy) * 1.05
      ctx.clearRect(0, 0, width, height)

      for (const line of lines) {
        const cos = Math.cos(line.angle)
        const sin = Math.sin(line.angle)
        const toEdge = Math.min(
          cx / Math.max(Math.abs(cos), 1e-3),
          cy / Math.max(Math.abs(sin), 1e-3)
        )
        const half = (line.width * dpr) / 2 / radius
        const inner = line.inner * toEdge
        const gradient = ctx.createLinearGradient(
          cx + cos * inner,
          cy + sin * inner,
          cx + cos * toEdge,
          cy + sin * toEdge
        )
        gradient.addColorStop(0, "rgba(255,255,255,0)")
        gradient.addColorStop(0.5, "rgba(255,255,255,0.75)")
        gradient.addColorStop(1, "rgba(255,255,255,1)")
        ctx.fillStyle = gradient
        ctx.globalAlpha = boost * MAX_ALPHA * line.alpha
        ctx.beginPath()
        ctx.moveTo(
          cx + Math.cos(line.angle - half) * radius,
          cy + Math.sin(line.angle - half) * radius
        )
        ctx.lineTo(
          cx + Math.cos(line.angle + half) * radius,
          cy + Math.sin(line.angle + half) * radius
        )
        ctx.lineTo(cx + cos * inner, cy + sin * inner)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none"
      }}
    />
  )
}
