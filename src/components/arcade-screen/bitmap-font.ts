/** The arcade's original FFFlauta-100 atlas (flauta.ttf is FFFlauta-200). */
interface Glyph {
  id: number
  x: number
  y: number
  width: number
  height: number
  xoffset: number
  yoffset: number
  xadvance: number
}
interface FontData {
  pages: string[]
  chars: Glyph[]
  kernings: { first: number; second: number; amount: number }[]
  info: { size: number }
  distanceField: { distanceRange: number }
}

export interface ArcadeBitmapFont {
  measure: (text: string, size: number) => number
  draw: (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    color: string
  ) => void
}

let pending: Promise<ArcadeBitmapFont> | undefined
export function loadArcadeBitmapFont() {
  return (pending ??= loadFont())
}

async function loadFont(): Promise<ArcadeBitmapFont> {
  const response = await fetch("/fonts/ffflauta.json")
  if (!response.ok) throw new Error("Arcade font could not be loaded")
  const data: FontData = await response.json()
  const image = new Image()
  image.src = data.pages[0]
  await image.decode()
  const atlas = document.createElement("canvas")
  atlas.width = image.width
  atlas.height = image.height
  const ctx = atlas.getContext("2d")!
  ctx.drawImage(image, 0, 0)
  const pixels = ctx.getImageData(0, 0, atlas.width, atlas.height).data
  const glyphs = new Map(data.chars.map((glyph) => [glyph.id, glyph]))
  const kerning = new Map(
    data.kernings.map((pair) => [`${pair.first}:${pair.second}`, pair.amount])
  )
  const sprites = new Map<string, HTMLCanvasElement>()
  const top = Math.min(
    ...data.chars
      .filter((glyph) => glyph.id >= 65 && glyph.id <= 90)
      .map((glyph) => glyph.yoffset)
  )
  const advance = (
    text: string,
    size: number,
    draw?: (glyph: Glyph, x: number) => void
  ) => {
    let x = 0,
      previous = 0
    for (const character of text) {
      const id = character.codePointAt(0)!
      const glyph = glyphs.get(id) ?? glyphs.get(63)!
      x += kerning.get(`${previous}:${id}`) ?? 0
      draw?.(glyph, (x * size) / data.info.size)
      x += glyph.xadvance
      previous = id
    }
    return (x * size) / data.info.size
  }
  const sprite = (glyph: Glyph, size: number, color: string) => {
    const key = `${glyph.id}:${size}:${color}`
    const cached = sprites.get(key)
    if (cached) return cached
    const scale = size / data.info.size
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.ceil(glyph.width * scale * 2))
    canvas.height = Math.max(1, Math.ceil(glyph.height * scale * 2))
    const context = canvas.getContext("2d")!
    const output = context.createImageData(canvas.width, canvas.height)
    const range = data.distanceField.distanceRange * scale * 2
    const sample = (x: number, y: number, channel: number) => {
      const left = Math.floor(x),
        upper = Math.floor(y)
      const dx = x - left,
        dy = y - upper
      const read = (x: number, y: number) =>
        pixels[
          (Math.max(0, Math.min(atlas.height - 1, y)) * atlas.width +
            Math.max(0, Math.min(atlas.width - 1, x))) *
            4 +
            channel
        ] / 255
      return (
        (read(left, upper) * (1 - dx) + read(left + 1, upper) * dx) * (1 - dy) +
        (read(left, upper + 1) * (1 - dx) + read(left + 1, upper + 1) * dx) * dy
      )
    }
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const sx = glyph.x + (x + 0.5) / (scale * 2) - 0.5
        const sy = glyph.y + (y + 0.5) / (scale * 2) - 0.5
        const r = sample(sx, sy, 0),
          g = sample(sx, sy, 1),
          b = sample(sx, sy, 2)
        const median = Math.max(Math.min(r, g), Math.min(Math.max(r, g), b))
        output.data[(y * canvas.width + x) * 4 + 3] =
          Math.max(0, Math.min(1, (median - 0.5) * range + 0.5)) * 255
      }
    context.putImageData(output, 0, 0)
    context.globalCompositeOperation = "source-in"
    context.fillStyle = color
    context.fillRect(0, 0, canvas.width, canvas.height)
    sprites.set(key, canvas)
    return canvas
  }
  return {
    measure: (text, size) => advance(text, size),
    draw: (ctx, text, x, y, size, color) => {
      const scale = size / data.info.size
      advance(text, size, (glyph, offset) => {
        if (!glyph.width || !glyph.height) return
        const image = sprite(glyph, size, color)
        ctx.drawImage(
          image,
          x + offset + glyph.xoffset * scale,
          y + (glyph.yoffset - top) * scale,
          image.width / 2,
          image.height / 2
        )
      })
    }
  }
}
