import type { SanityMuxVideo, SanityVideo } from "@/service/sanity/types"

export type ResolvedVideoSource =
  | { type: "mux"; playbackId: string; aspectRatio: string | null }
  | { type: "legacy"; url: string; mimeType: string | null }
  | null

/**
 * Picks Mux when a playback ID is present, otherwise falls back to the legacy
 * Sanity file asset. Returns null when neither is set.
 */
export function resolveVideoSource(input: {
  mux?: SanityMuxVideo | null
  legacy?: SanityVideo | null
}): ResolvedVideoSource {
  if (input.mux?.playbackId) {
    return {
      type: "mux",
      playbackId: input.mux.playbackId,
      aspectRatio: input.mux.aspectRatio ?? null
    }
  }
  if (input.legacy?.url) {
    return {
      type: "legacy",
      url: input.legacy.url,
      mimeType: input.legacy.mimeType ?? null
    }
  }
  return null
}
