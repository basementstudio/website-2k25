import {
  createContext,
  useContext
} from "react"
import {
  BufferAttribute,
  BufferGeometry,
  LinearFilter,
  Texture,
  TextureLoader
} from "three"

// --- Types ---

export interface GlyphMetrics {
  id: number
  char: string
  x: number
  y: number
  width: number
  height: number
  xoffset: number
  yoffset: number
  xadvance: number
}

export interface FontData {
  atlas: Texture
  glyphs: Map<number, GlyphMetrics>
  lineHeight: number
  base: number
  scaleW: number
  scaleH: number
  size: number
  distanceRange: number
}

// --- Font Loading ---

export async function loadMsdfFont(jsonUrl: string): Promise<FontData> {
  const res = await fetch(jsonUrl)
  const json = await res.json()

  // Decode base64 PNG atlas from pages[0]
  const atlasDataUrl = json.pages[0]
  const atlas = await new TextureLoader().loadAsync(atlasDataUrl)
  atlas.flipY = false
  atlas.minFilter = LinearFilter
  atlas.magFilter = LinearFilter
  atlas.needsUpdate = true

  // Build glyph lookup
  const glyphs = new Map<number, GlyphMetrics>()
  for (const c of json.chars) {
    glyphs.set(c.id, {
      id: c.id,
      char: String.fromCharCode(c.id),
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      xoffset: c.xoffset,
      yoffset: c.yoffset,
      xadvance: c.xadvance
    })
  }

  return {
    atlas,
    glyphs,
    lineHeight: json.common.lineHeight,
    base: json.common.base,
    scaleW: json.common.scaleW,
    scaleH: json.common.scaleH,
    size: json.info.size,
    distanceRange: json.distanceField?.distanceRange ?? 4
  }
}

// --- Geometry Builder ---

/**
 * Build a merged BufferGeometry for all glyphs in the text string.
 * Each glyph is a quad (2 triangles, 6 vertices).
 * Origin is at the top-left of the text.
 */
export function buildTextGeometry(
  text: string,
  fontSize: number,
  font: FontData
): BufferGeometry {
  const scale = fontSize / font.size
  const positions: number[] = []
  const uvs: number[] = []

  let cursorX = 0

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const glyph = font.glyphs.get(code)
    if (!glyph) {
      // Space or missing char — just advance
      cursorX += (font.glyphs.get(32)?.xadvance ?? font.size * 0.5) * scale
      continue
    }

    if (glyph.width === 0 || glyph.height === 0) {
      cursorX += glyph.xadvance * scale
      continue
    }

    // Quad corners in local space (Y goes down from top)
    const x0 = cursorX + glyph.xoffset * scale
    const y0 = -(glyph.yoffset * scale)
    const x1 = x0 + glyph.width * scale
    const y1 = y0 - glyph.height * scale

    // UV coordinates into the atlas
    const u0 = glyph.x / font.scaleW
    const v0 = glyph.y / font.scaleH
    const u1 = (glyph.x + glyph.width) / font.scaleW
    const v1 = (glyph.y + glyph.height) / font.scaleH

    // Two triangles (CCW winding)
    // Triangle 1: top-left, bottom-left, top-right
    positions.push(x0, y0, 0, x0, y1, 0, x1, y0, 0)
    uvs.push(u0, v0, u0, v1, u1, v0)

    // Triangle 2: top-right, bottom-left, bottom-right
    positions.push(x1, y0, 0, x0, y1, 0, x1, y1, 0)
    uvs.push(u1, v0, u0, v1, u1, v1)

    cursorX += glyph.xadvance * scale
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3)
  )
  geometry.setAttribute(
    "uv",
    new BufferAttribute(new Float32Array(uvs), 2)
  )

  return geometry
}

/**
 * Measure the width of a text string in virtual units.
 */
export function measureText(
  text: string,
  fontSize: number,
  font: FontData
): number {
  const scale = fontSize / font.size
  let width = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const glyph = font.glyphs.get(code)
    width += (glyph?.xadvance ?? font.size * 0.5) * scale
  }
  return width
}

// --- React Context ---

export const MsdfFontContext = createContext<FontData | null>(null)

export function useMsdfFont(): FontData {
  const font = useContext(MsdfFontContext)
  if (!font) throw new Error("useMsdfFont must be used within MsdfFontContext.Provider")
  return font
}
