import type { PortableTextBlock as PTBlock } from "@portabletext/types"

/** Sanity image projected via `imageFragment`. */
export interface SanityImage {
  alt?: string | null
  asset: {
    url: string
    metadata: {
      dimensions: { width: number; height: number }
      lqip: string
    }
  } | null
}

/** Sanity video projected via `videoFragment` (file asset). */
export interface SanityVideo {
  url: string | null
  mimeType: string | null
}

/** Sanity Mux video projected via `muxVideoFragment` (mux.video field). */
export interface SanityMuxVideo {
  playbackId: string | null
  assetId: string | null
  aspectRatio: string | null
  duration: number | null
}

/** Sanity slug object. */
export interface SanitySlug {
  current: string
}

/** Re-export for convenience so consumers don't need @portabletext/types. */
export type PortableTextBlock = PTBlock
