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
  MatrixSpec,
  SCORE_COLOR,
  SCORE_GHOST,
  textCols
} from "./led-matrix"
import { useLeaderboardScores } from "./scoreboard"

const MAX_ENTRIES = 10

// Hangs from the mezzanine railing to the right of the hoop
const PANEL_POSITION: [number, number, number] = [7.05, 3.52, -14.412]
const PANEL_HEIGHT = 1.45
const ROD_HEIGHT = 0.22
const ROD_RADIUS = 0.008
const ROD_INSET = 0.09

const CELL = 16
const BEZEL = 12
const MARGIN = 24
const CORNER_RADIUS = 24
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
const PANEL_WIDTH = PANEL_HEIGHT * (CANVAS_WIDTH / CANVAS_HEIGHT)

const SPEC: MatrixSpec = { cell: CELL, pad: PAD }

const HEADER = "TOP 10"

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

    texture.needsUpdate = true
    invalidate()
  }, [ctx, texture, highScores, invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  if (!isBasketball) return null

  return (
    <group position={PANEL_POSITION}>
      <mesh>
        <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[
            side * (PANEL_WIDTH / 2 - ROD_INSET),
            PANEL_HEIGHT / 2 + ROD_HEIGHT / 2,
            0
          ]}
        >
          <cylinderGeometry args={[ROD_RADIUS, ROD_RADIUS, ROD_HEIGHT, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}
