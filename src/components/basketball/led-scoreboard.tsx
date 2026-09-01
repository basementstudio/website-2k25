import { useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { CanvasTexture, SRGBColorSpace } from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useMinigameStore } from "@/store/minigame-store"

import {
  AMBER,
  AMBER_GHOST,
  drawGhostGrid,
  drawGlyphRow,
  drawPanel,
  MatrixSpec,
  SCORE_COLOR,
  SCORE_GHOST,
  textCols
} from "./led-matrix"

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
const PAD = BEZEL + MARGIN
const CANVAS_WIDTH = GRID_COLS * CELL + PAD * 2
const CANVAS_HEIGHT = GRID_ROWS * CELL + PAD * 2

const SPEC: MatrixSpec = { cell: CELL, pad: PAD }

const formatClock = (t: number) => {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
}

const drawBoard = (
  ctx: CanvasRenderingContext2D,
  clockText: string,
  scoreText: string
) => {
  drawPanel(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, BEZEL, CORNER_RADIUS)

  drawGhostGrid(ctx, SPEC, GRID_COLS, GRID_ROWS, (row) =>
    row < SCORE_ROW - 1 ? AMBER_GHOST : SCORE_GHOST
  )

  const clockStart = Math.floor((GRID_COLS - textCols(clockText)) / 2)
  const clockEnd = clockStart + textCols(clockText)

  drawGlyphRow(ctx, SPEC, clockText, CLOCK_ROW, AMBER, clockStart)
  drawGlyphRow(
    ctx,
    SPEC,
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
