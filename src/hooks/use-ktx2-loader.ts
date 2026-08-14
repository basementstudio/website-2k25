import { useThree } from "@react-three/fiber"
import type { Texture, WebGLRenderer } from "three"
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"

// Served from public/, so it is fetched by URL and never resolved through
// node_modules — nothing makes it track the installed `three`. Keep the two in
// step with `pnpm basis:sync` (wired into `pnpm build`); `pnpm basis:check`
// asserts without writing.
//
// A mismatch here is invisible on a Mac: Apple GPUs expose the ASTC `hdr`
// profile, so KTX2Loader decodes the UASTC HDR lightmaps directly and never
// loads this transcoder. Windows has no ASTC and must transcode to BC6H, so a
// transcoder older than basis_universal 1.60 (no UASTC HDR) fails there and
// only there, as `THREE.KTX2Loader: .transcodeImage failed.`
const TRANSCODER_PATH = "/basis-transcoder/"

let loader: KTX2Loader | null = null

export const getKTX2Loader = (gl: WebGLRenderer): KTX2Loader => {
  if (!loader) {
    loader = new KTX2Loader()
    loader.setTranscoderPath(TRANSCODER_PATH)
    loader.detectSupport(gl)
  }
  return loader
}

interface Entry {
  promise: Promise<unknown>
  texture?: Texture
  error?: unknown
}

const cache = new Map<string, Entry>()

export const useKTX2Textures = (urls: string[]): Texture[] => {
  const gl = useThree((state) => state.gl)
  const ktx2 = getKTX2Loader(gl)

  const entries = urls.map((url) => {
    const existing = cache.get(url)
    if (existing) return existing

    const entry: Entry = { promise: Promise.resolve() }
    entry.promise = ktx2.loadAsync(url).then(
      (texture) => {
        entry.texture = texture as Texture
      },
      (error) => {
        entry.error = error
      }
    )
    cache.set(url, entry)
    return entry
  })

  const pending = entries
    .filter((e) => !e.texture && !e.error)
    .map((e) => e.promise)
  if (pending.length > 0) throw Promise.all(pending)

  const failed = entries.find((e) => e.error)
  if (failed) throw failed.error

  return entries.map((e) => e.texture!)
}
