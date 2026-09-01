import { useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { CanvasTexture, SRGBColorSpace } from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useMinigameStore } from "@/store/minigame-store"

const BOARD_POSITION: [number, number, number] = [5.198, 4.46, -14.414]
const FACE_SIZE: [number, number] = [0.693, 0.52]

const CELL = 32
const MARGIN = 88
const BEZEL = 24
const CORNER_RADIUS = 48
const GRID_COLS = 25
const GRID_ROWS = 17
const CLOCK_ROW = 0
const SCORE_ROW = 10
const GLYPH_GAP = 1
const PAD = BEZEL + MARGIN
const CANVAS_WIDTH = GRID_COLS * CELL + PAD * 2
const CANVAS_HEIGHT = GRID_ROWS * CELL + PAD * 2

const BACKGROUND = "rgba(10, 10, 12, 0.6)"
const BEZEL_COLOR = "#ffffff"
const AMBER = "#ffb020"
const AMBER_GHOST = "#241804"
const SCORE_COLOR = "#ff4d00"
const SCORE_GHOST = "#261000"

// prettier-ignore
const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ":": ["000", "010", "000", "000", "000", "010", "000"]
}

const formatClock = (t: number) => {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
}

const drawDot = (
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  radius: number,
  color: string,
  alpha = 1
) => {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(
    PAD + (col + 0.5) * CELL,
    PAD + (row + 0.5) * CELL,
    radius,
    0,
    Math.PI * 2
  )
  ctx.fill()
  ctx.globalAlpha = 1
}

const textCols = (text: string) => {
  const glyphs = [...text].map((char) => GLYPHS[char]).filter(Boolean)
  return (
    glyphs.reduce((cols, glyph) => cols + glyph[0].length, 0) +
    (glyphs.length - 1) * GLYPH_GAP
  )
}

const drawGlyphRow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  gridRow: number,
  color: string,
  startCol: number
) => {
  const glyphs = [...text].map((char) => GLYPHS[char]).filter(Boolean)

  let col = startCol

  for (const glyph of glyphs) {
    glyph.forEach((bits, row) => {
      for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== "1") continue
        drawDot(ctx, col + i, gridRow + row, CELL * 0.38, color)
      }
    })
    col += glyph[0].length + GLYPH_GAP
  }
}

const drawBoard = (
  ctx: CanvasRenderingContext2D,
  clockText: string,
  scoreText: string
) => {
  const innerRect = [
    BEZEL,
    BEZEL,
    CANVAS_WIDTH - BEZEL * 2,
    CANVAS_HEIGHT - BEZEL * 2
  ] as const
  const innerRadius = CORNER_RADIUS - BEZEL

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = BEZEL_COLOR
  ctx.beginPath()
  ctx.roundRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, CORNER_RADIUS)
  ctx.fill()

  ctx.globalCompositeOperation = "destination-out"
  ctx.beginPath()
  ctx.roundRect(...innerRect, innerRadius)
  ctx.fill()
  ctx.globalCompositeOperation = "source-over"

  ctx.fillStyle = BACKGROUND
  ctx.beginPath()
  ctx.roundRect(...innerRect, innerRadius)
  ctx.fill()

  for (let row = 0; row < GRID_ROWS; row++) {
    const ghost = row < SCORE_ROW - 1 ? AMBER_GHOST : SCORE_GHOST
    for (let col = 0; col < GRID_COLS; col++) {
      drawDot(ctx, col, row, CELL * 0.32, ghost)
    }
  }

  const clockStart = Math.floor((GRID_COLS - textCols(clockText)) / 2)
  const clockEnd = clockStart + textCols(clockText)

  drawGlyphRow(ctx, clockText, CLOCK_ROW, AMBER, clockStart)
  drawGlyphRow(
    ctx,
    scoreText,
    SCORE_ROW,
    SCORE_COLOR,
    clockEnd - textCols(scoreText)
  )
}

export const LedScoreboard = () => {
  const isBasketball = useNavigationStore(
    (state) => state.currentScene?.name === "basketball"
  )
  const invalidate = useThree((state) => state.invalidate)
  const clockText = useMinigameStore((state) =>
    formatClock(state.timeRemaining)
  )
  const scoreText = useMinigameStore((state) =>
    String(Math.min(Math.floor(state.score), 999))
  )

  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 16
    return { ctx: canvas.getContext("2d"), texture }
  }, [])

  useEffect(() => {
    if (!ctx) return
    drawBoard(ctx, clockText, scoreText)
    texture.needsUpdate = true
    invalidate()
  }, [ctx, texture, clockText, scoreText, invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  if (!isBasketball) return null

  return (
    <mesh position={BOARD_POSITION}>
      <planeGeometry args={FACE_SIZE} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  )
}
