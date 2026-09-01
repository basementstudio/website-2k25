// Shared 5x7 dot-matrix drawing helpers for the LED scoreboard and
// leaderboard panels.
import { Color } from "three"

// Over-bright material multiplier: pushes lit dots and the bezel past the
// postprocessing bloom luminance threshold so panels glow like the neon
// basement sign, whose GLB material is white emissive with
// KHR_materials_emissive_strength 10
export const LED_GLOW = new Color(10, 10, 10)

// prettier-ignore
export const GLYPHS: Record<string, string[]> = {
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
  ":": ["000", "010", "000", "000", "000", "010", "000"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  " ": ["00", "00", "00", "00", "00", "00", "00"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
}

export const GLYPH_GAP = 1
export const GLYPH_ROWS = 7

export const AMBER = "#ffb020"
export const AMBER_GHOST = "#0b0703"
export const SCORE_COLOR = "#ff4d00"
export const PANEL_BACKGROUND = "rgba(10, 10, 12, 0.6)"
export const BEZEL_COLOR = "#ffffff"

/** Pixel geometry of a dot-matrix panel: dot cell size and inner padding. */
export interface MatrixSpec {
  cell: number
  pad: number
}

export const textCols = (text: string) => {
  const glyphs = [...text].map((char) => GLYPHS[char]).filter(Boolean)
  return (
    glyphs.reduce((cols, glyph) => cols + glyph[0].length, 0) +
    (glyphs.length - 1) * GLYPH_GAP
  )
}

export const drawDot = (
  ctx: CanvasRenderingContext2D,
  spec: MatrixSpec,
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
    spec.pad + (col + 0.5) * spec.cell,
    spec.pad + (row + 0.5) * spec.cell,
    radius,
    0,
    Math.PI * 2
  )
  ctx.fill()
  ctx.globalAlpha = 1
}

export const drawGlyphRow = (
  ctx: CanvasRenderingContext2D,
  spec: MatrixSpec,
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
        drawDot(ctx, spec, col + i, gridRow + row, spec.cell * 0.38, color)
      }
    })
    col += glyph[0].length + GLYPH_GAP
  }
}

/** White rounded bezel with a translucent dark inner face. */
export const drawPanel = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bezel: number,
  cornerRadius: number,
  background: string = PANEL_BACKGROUND
) => {
  const innerRect = [
    bezel,
    bezel,
    width - bezel * 2,
    height - bezel * 2
  ] as const
  const innerRadius = cornerRadius - bezel

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = BEZEL_COLOR
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, cornerRadius)
  ctx.fill()

  ctx.globalCompositeOperation = "destination-out"
  ctx.beginPath()
  ctx.roundRect(...innerRect, innerRadius)
  ctx.fill()
  ctx.globalCompositeOperation = "source-over"

  ctx.fillStyle = background
  ctx.beginPath()
  ctx.roundRect(...innerRect, innerRadius)
  ctx.fill()
}

/**
 * Unlit-dot field covering the whole panel face: the lattice extends past
 * the content grid through the padding right up to the bezel (clipped to
 * the rounded face), so there is no dead band between screen and frame.
 * Color decided per cell so regions can differ.
 */
export const drawScreenDotField = (
  ctx: CanvasRenderingContext2D,
  spec: MatrixSpec,
  width: number,
  height: number,
  bezel: number,
  cornerRadius: number,
  cols: number,
  rows: number,
  colorFor: (row: number, col: number) => string
) => {
  const extend = Math.ceil(spec.pad / spec.cell)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(
    bezel,
    bezel,
    width - bezel * 2,
    height - bezel * 2,
    cornerRadius - bezel
  )
  ctx.clip()
  for (let row = -extend; row < rows + extend; row++) {
    for (let col = -extend; col < cols + extend; col++) {
      drawDot(ctx, spec, col, row, spec.cell * 0.32, colorFor(row, col))
    }
  }
  ctx.restore()
}
