import { readFileSync, writeFileSync } from "node:fs"

import sharp from "sharp"

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error("Usage: pnpm assets:glb-recode-webp <in.glb> <out.glb>")
  process.exit(1)
}

const GLB_MAGIC = 0x46546c67 // "glTF"
const CHUNK_JSON = 0x4e4f534a
const CHUNK_BIN = 0x004e4942
const pad4 = (n: number) => (n + 3) & ~3

const glb = readFileSync(input)
if (glb.readUInt32LE(0) !== GLB_MAGIC) {
  console.error(`${input} is not a .glb`)
  process.exit(1)
}

let offset = 12
let json: any = null
let bin: Buffer | null = null
while (offset < glb.length) {
  const length = glb.readUInt32LE(offset)
  const type = glb.readUInt32LE(offset + 4)
  const body = glb.subarray(offset + 8, offset + 8 + length)
  if (type === CHUNK_JSON) json = JSON.parse(body.toString("utf8"))
  else if (type === CHUNK_BIN) bin = Buffer.from(body)
  offset += 8 + pad4(length)
}
if (!json || !bin) {
  console.error("missing JSON or BIN chunk")
  process.exit(1)
}

const images: any[] = json.images ?? []
const targets = images.filter((img) => img.mimeType === "image/webp")
if (targets.length === 0) {
  writeFileSync(output, glb)
  console.log(`  no WebP textures in ${input}; copied unchanged`)
  process.exit(0)
}

async function main() {
  const replacements = new Map<number, Buffer>()
  for (const img of targets) {
    if (img.bufferView === undefined) {
      console.error(`  image "${img.name}" has no bufferView (external URI?)`)
      process.exit(1)
    }
    const view = json.bufferViews[img.bufferView]
    const start = (view.byteOffset ?? 0) + 0
    const src = bin!.subarray(start, start + view.byteLength)
    const png = await sharp(src).png({ compressionLevel: 9 }).toBuffer()
    replacements.set(img.bufferView, png)
    img.mimeType = "image/png"
  }

  // replaced images change every later byteOffset, so rebuild BIN
  const binChunk: Buffer = bin
  const order = (json.bufferViews as any[])
    .map((view, index) => ({ view, index }))
    .sort((a, b) => (a.view.byteOffset ?? 0) - (b.view.byteOffset ?? 0))

  const parts: Buffer[] = []
  let cursor = 0
  for (const { view, index } of order) {
    const replaced = replacements.get(index)
    const data =
      replaced ??
      binChunk.subarray(
        view.byteOffset ?? 0,
        (view.byteOffset ?? 0) + view.byteLength
      )
    // Accessors require their bufferView to be 4-byte aligned; images do not care,
    // so aligning everything is safe and keeps the arithmetic simple.
    const padding = pad4(cursor) - cursor
    if (padding > 0) parts.push(Buffer.alloc(padding))
    cursor += padding

    parts.push(Buffer.from(data))
    view.byteOffset = cursor
    view.byteLength = data.length
    cursor += data.length
  }

  const newBin = Buffer.concat(parts)
  json.buffers = [{ byteLength: newBin.length }]

  const jsonChunk = Buffer.from(JSON.stringify(json), "utf8")
  const jsonPadded = Buffer.concat([
    jsonChunk,
    Buffer.alloc(pad4(jsonChunk.length) - jsonChunk.length, 0x20)
  ])
  const binPadded = Buffer.concat([
    newBin,
    Buffer.alloc(pad4(newBin.length) - newBin.length)
  ])

  const header = Buffer.alloc(12)
  header.writeUInt32LE(GLB_MAGIC, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binPadded.length, 8)
  const chunkHeader = (length: number, type: number) => {
    const b = Buffer.alloc(8)
    b.writeUInt32LE(length, 0)
    b.writeUInt32LE(type, 4)
    return b
  }

  writeFileSync(
    output,
    Buffer.concat([
      header,
      chunkHeader(jsonPadded.length, CHUNK_JSON),
      jsonPadded,
      chunkHeader(binPadded.length, CHUNK_BIN),
      binPadded
    ])
  )

  console.log(
    `  recoded ${targets.length} WebP texture(s) to PNG: ` +
      `${(glb.length / 1024).toFixed(0)}KB → ${((12 + 8 + jsonPadded.length + 8 + binPadded.length) / 1024).toFixed(0)}KB (intermediate)`
  )
}

main()
