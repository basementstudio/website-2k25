"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/utils/cn"

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
import { useLeaderboardScores } from "./scoreboard"

const MAX_ENTRIES = 10

const CELL = 8
const BEZEL = 6
const MARGIN = 12
const CORNER_RADIUS = 12
const PAD = BEZEL + MARGIN

// 3-letter name block (17 cols), 2-col gap, right-aligned 3-digit score block
const NAME_COLS = 17
const GAP_COLS = 2
const SCORE_COLS = 17
const GRID_COLS = NAME_COLS + GAP_COLS + SCORE_COLS
const HEADER_ROWS = 9
const ROW_STRIDE = 9
const GRID_ROWS = HEADER_ROWS + MAX_ENTRIES * ROW_STRIDE - 2

const CANVAS_WIDTH = GRID_COLS * CELL + PAD * 2
const CANVAS_HEIGHT = GRID_ROWS * CELL + PAD * 2

const SPEC: MatrixSpec = { cell: CELL, pad: PAD }

const HEADER = "TOP 10"

interface LedLeaderboardProps {
  className?: string
}

export const LedLeaderboard = ({ className }: LedLeaderboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const highScores = useLeaderboardScores()

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    drawPanel(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, BEZEL, CORNER_RADIUS)
    drawGhostGrid(ctx, SPEC, GRID_COLS, GRID_ROWS, (row, col) =>
      row < HEADER_ROWS - 2 || col < NAME_COLS + GAP_COLS
        ? AMBER_GHOST
        : SCORE_GHOST
    )

    drawGlyphRow(
      ctx,
      SPEC,
      HEADER,
      0,
      AMBER,
      Math.floor((GRID_COLS - textCols(HEADER)) / 2)
    )

    highScores.slice(0, MAX_ENTRIES).forEach((entry, i) => {
      const row = HEADER_ROWS + i * ROW_STRIDE
      const name = entry.player_name.toUpperCase().slice(0, 3)
      const score = String(Math.max(0, Math.min(Math.floor(entry.score), 999)))
      drawGlyphRow(ctx, SPEC, name, row, AMBER, 0)
      drawGlyphRow(
        ctx,
        SPEC,
        score,
        row,
        SCORE_COLOR,
        GRID_COLS - textCols(score)
      )
    })
  }, [highScores])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={cn("h-auto select-none", className)}
      style={{ width: CANVAS_WIDTH / 2 }}
    />
  )
}
