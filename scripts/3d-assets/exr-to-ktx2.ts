/**
 * Converts HDR lightmap .exr files to UASTC HDR 4x4 .ktx2.
 *
 * Usage:
 *   pnpm assets:exr-to-ktx2 public/3d/textures/bake-00-lightmap-d25dcd28.exr [...]
 *   pnpm assets:exr-to-ktx2 --all
 *
 * Requires `basisu` v1.60+ on PATH: `brew install basis-universal`.
 *
 * Do not change the row reversal or add -y_flip; either one alone flips the
 * lightmaps in-scene.
 */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, extname, join } from "node:path"

import { EXRLoader } from "three-stdlib"

const TEXTURE_DIR = "public/3d/textures"
const ZSTD_LEVEL = 19

function writeUncompressedEXR(
  outPath: string,
  width: number,
  height: number,
  halfRGBA: Uint16Array
) {
  const parts: Buffer[] = []
  const i32 = (v: number) => {
    const b = Buffer.alloc(4)
    b.writeInt32LE(v)
    return b
  }
  const u32 = (v: number) => {
    const b = Buffer.alloc(4)
    b.writeUInt32LE(v)
    return b
  }
  const f32 = (v: number) => {
    const b = Buffer.alloc(4)
    b.writeFloatLE(v)
    return b
  }
  const str0 = (s: string) =>
    Buffer.concat([Buffer.from(s, "latin1"), Buffer.alloc(1)])
  const attr = (name: string, type: string, data: Buffer) =>
    Buffer.concat([str0(name), str0(type), i32(data.length), data])

  parts.push(u32(20000630)) // magic
  parts.push(u32(2)) // version 2, single-part scanline

  // chlist must be alphabetical
  const chan = (n: string) =>
    Buffer.concat([
      str0(n),
      i32(1), // HALF
      Buffer.from([0, 0, 0, 0]), // pLinear + 3 reserved
      i32(1), // xSampling
      i32(1) // ySampling
    ])
  parts.push(
    attr(
      "channels",
      "chlist",
      Buffer.concat([chan("B"), chan("G"), chan("R"), Buffer.alloc(1)])
    )
  )
  parts.push(attr("compression", "compression", Buffer.from([0]))) // NONE
  const box = Buffer.concat([i32(0), i32(0), i32(width - 1), i32(height - 1)])
  parts.push(attr("dataWindow", "box2i", box))
  parts.push(attr("displayWindow", "box2i", box))
  parts.push(attr("lineOrder", "lineOrder", Buffer.from([0]))) // INCREASING_Y
  parts.push(attr("pixelAspectRatio", "float", f32(1)))
  parts.push(attr("screenWindowCenter", "v2f", Buffer.concat([f32(0), f32(0)])))
  parts.push(attr("screenWindowWidth", "float", f32(1)))
  parts.push(Buffer.alloc(1)) // end of header

  const headerLen = parts.reduce((a, b) => a + b.length, 0)
  const scanlineLen = 8 + 3 * width * 2
  const firstOffset = headerLen + height * 8

  const offsets = Buffer.alloc(height * 8)
  for (let y = 0; y < height; y++) {
    offsets.writeBigUInt64LE(BigInt(firstOffset + y * scanlineLen), y * 8)
  }
  parts.push(offsets)

  const body = Buffer.alloc(height * scanlineLen)
  let p = 0
  for (let y = 0; y < height; y++) {
    body.writeInt32LE(y, p)
    p += 4
    body.writeInt32LE(3 * width * 2, p)
    p += 4
    for (const c of [2, 1, 0]) {
      for (let x = 0; x < width; x++) {
        body.writeUInt16LE(halfRGBA[(y * width + x) * 4 + c], p)
        p += 2
      }
    }
  }
  parts.push(body)

  writeFileSync(outPath, Buffer.concat(parts))
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error("Usage: pnpm assets:exr-to-ktx2 <file.exr> [...]  |  --all")
  process.exit(1)
}

try {
  execFileSync("basisu", ["-version"], { stdio: "pipe" })
} catch {
  console.error(
    "basisu not found on PATH. Install with: brew install basis-universal"
  )
  process.exit(1)
}

const inputs =
  args[0] === "--all"
    ? readdirSync(TEXTURE_DIR)
        .filter((f) => f.endsWith(".exr") && /lightmap/i.test(f))
        .map((f) => join(TEXTURE_DIR, f))
        .sort()
    : args

const loader = new EXRLoader()
const scratch = mkdtempSync(join(tmpdir(), "exr-ktx2-"))
let totalBefore = 0
let totalAfter = 0

try {
  for (const src of inputs) {
    if (!existsSync(src)) {
      console.error(`  ✗ not found: ${src}`)
      process.exitCode = 1
      continue
    }

    const raw = readFileSync(src)
    const tex = loader.parse(
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
    ) as { width: number; height: number; data: Uint16Array }

    if (!(tex.data instanceof Uint16Array)) {
      console.error(
        `  ✗ ${basename(src)}: expected half-float EXR, got ${tex.data.constructor.name}`
      )
      process.exitCode = 1
      continue
    }

    const stem = basename(src, extname(src)).replace(/-[a-f0-9]{8}$/, "")
    const plain = join(scratch, `${stem}.exr`)
    const encoded = join(scratch, `${stem}.ktx2`)

    // EXRLoader's rows are bottom-up
    const { width, height, data } = tex
    const topDown = new Uint16Array(data.length)
    for (let y = 0; y < height; y++) {
      const from = (height - 1 - y) * width * 4
      topDown.set(data.subarray(from, from + width * 4), y * width * 4)
    }
    writeUncompressedEXR(plain, width, height, topDown)

    execFileSync(
      "basisu",
      [
        "-hdr_4x4",
        "-ktx2_zstandard_level",
        String(ZSTD_LEVEL),
        "-file",
        plain,
        "-output_file",
        encoded
      ],
      { stdio: "pipe" }
    )

    const out = readFileSync(encoded)
    const hash = createHash("sha256")
      .update(new Uint8Array(out))
      .digest("hex")
      .slice(0, 8)
    const finalName = `${stem}-${hash}.ktx2`
    const finalPath = join(dirname(src), finalName)
    writeFileSync(finalPath, out)

    const before = statSync(src).size
    const after = out.length
    totalBefore += before
    totalAfter += after
    console.log(
      `  ✓ ${basename(src)}\n` +
        `      ${tex.width}x${tex.height}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB  (${((after / before) * 100).toFixed(0)}%)\n` +
        `      URL: /${finalPath.replace(/^public\//, "")}`
    )
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

if (totalBefore > 0) {
  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(2)}MB → ${(totalAfter / 1024 / 1024).toFixed(2)}MB ` +
      `(${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% smaller). ` +
      `Now update asset-manifest.ts, delete the .exr files, and run pnpm assets:verify.`
  )
}
