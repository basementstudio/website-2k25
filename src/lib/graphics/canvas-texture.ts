import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three"
let font: Promise<FontFace> | undefined
export function loadArcadeFont() {
  if (!font)
    font = new FontFace("ArcadeFlauta", "url(/fonts/flauta.ttf)")
      .load()
      .then((face) => {
        document.fonts.add(face)
        return face
      })
  return font
}
export function createCanvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  return { canvas, context, texture }
}
