import { useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { CanvasTexture, SRGBColorSpace } from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import {
  AMBER,
  AMBER_GHOST,
  drawGhostGrid,
  drawGlyphRow,
  drawPanel,
  GLYPHS,
  LED_GLOW,
  MatrixSpec,
  SCORE_COLOR,
  SCORE_GHOST,
  textCols
} from "./led-matrix"
import { useLeaderboardScores } from "./scoreboard"

const MAX_ENTRIES = 12

// Wide three-column board on the wall band above the neon basement sign
// (SM_LogoBasement sits at [8.44, 2.6, -14.6]; the panel floats just proud
// of that wall)
const PANEL_POSITION: [number, number, number] = [8.3, 3.69, -14.35]
const PANEL_WIDTH = 1.9

const CELL = 16
const BEZEL = 12
const MARGIN = 80
const CORNER_RADIUS = 24
const PAD = BEZEL + MARGIN

// Three columns of four entry slots; each column is a 3-letter
// name block (17 cols), 2-col gap, right-aligned 3-digit score block
const NAME_COLS = 17
const GAP_COLS = 2
const SCORE_COLS = 17
const COLUMN_COLS = NAME_COLS + GAP_COLS + SCORE_COLS
const COLUMN_GAP = 6
const COLUMNS = 3
const ROWS_PER_COLUMN = 4
const GRID_COLS = COLUMN_COLS * COLUMNS + COLUMN_GAP * (COLUMNS - 1)
const ROW_STRIDE = 11
const HEADER_ROWS = 13
const GRID_ROWS = HEADER_ROWS + ROWS_PER_COLUMN * ROW_STRIDE - 4

const CANVAS_WIDTH = GRID_COLS * CELL + PAD * 2
const CANVAS_HEIGHT = GRID_ROWS * CELL + PAD * 2
const PANEL_HEIGHT = PANEL_WIDTH * (CANVAS_HEIGHT / CANVAS_WIDTH)

const SPEC: MatrixSpec = { cell: CELL, pad: PAD }

const HEADER = "HIGH-SCORES"

export const LedLeaderboard = () => {
  const isBasketball = useNavigationStore(
    (state) => state.currentScene?.name === "basketball"
  )
  const invalidate = useThree((state) => state.invalidate)
  const highScores = useLeaderboardScores()

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

    // Near-opaque face: the animated white lamp doodle sits right behind
    // this wall band and would glow through the default translucent panel
    drawPanel(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      BEZEL,
      CORNER_RADIUS,
      "rgba(10, 10, 12, 1)"
    )
    drawGhostGrid(ctx, SPEC, GRID_COLS, GRID_ROWS, (row, col) => {
      if (row < HEADER_ROWS - 2) return AMBER_GHOST
      const colInColumn = col % (COLUMN_COLS + COLUMN_GAP)
      return colInColumn >= NAME_COLS + GAP_COLS ? SCORE_GHOST : AMBER_GHOST
    })

    drawGlyphRow(
      ctx,
      SPEC,
      HEADER,
      0,
      AMBER,
      Math.floor((GRID_COLS - textCols(HEADER)) / 2)
    )

    // Skip entries whose name has no renderable glyphs (legacy symbol-only
    // names would show as a blank slot); the next score takes their place
    const renderable = highScores.filter((entry) =>
      [...entry.player_name.toUpperCase()].some(
        (char) => char !== " " && GLYPHS[char]
      )
    )

    renderable.slice(0, MAX_ENTRIES).forEach((entry, i) => {
      const column = Math.floor(i / ROWS_PER_COLUMN)
      const columnStart = column * (COLUMN_COLS + COLUMN_GAP)
      const row = HEADER_ROWS + (i % ROWS_PER_COLUMN) * ROW_STRIDE
      const name = entry.player_name.toUpperCase().slice(0, 3)
      const score = String(Math.max(0, Math.min(Math.floor(entry.score), 999)))
      drawGlyphRow(ctx, SPEC, name, row, AMBER, columnStart)
      drawGlyphRow(
        ctx,
        SPEC,
        score,
        row,
        SCORE_COLOR,
        columnStart + COLUMN_COLS - textCols(score)
      )
    })

    texture.needsUpdate = true
    invalidate()
  }, [ctx, texture, highScores, invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  if (!isBasketball) return null

  return (
    <mesh position={PANEL_POSITION}>
      <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
      {/* Over-bright multiplier pushes lit dots and the bezel past the
          bloom luminance threshold so they glow like the neon sign; the
          near-black face stays below it */}
      <meshBasicMaterial map={texture} transparent color={LED_GLOW} />
    </mesh>
  )
}
