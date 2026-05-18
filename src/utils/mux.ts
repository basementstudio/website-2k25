const MUX_THUMBNAIL_BASE = "https://image.mux.com"

export const buildMuxPosterUrl = (
  playbackId: string,
  thumbnailTime?: number
) => {
  if (thumbnailTime == null) {
    return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp`
  }
  return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp?time=${thumbnailTime}`
}
