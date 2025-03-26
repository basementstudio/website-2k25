import { fragmentOn } from "basehub"

export const IMAGE_FRAGMENT = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true,
  blurDataURL: true
})

export type ImageFragment = fragmentOn.infer<typeof IMAGE_FRAGMENT>

export const VIDEO_FRAGMENT = fragmentOn("BlockVideo", {
  aspectRatio: true,
  height: true,
  width: true,
  url: true,
  mimeType: true
})

export type VideoFragment = fragmentOn.infer<typeof VIDEO_FRAGMENT>
