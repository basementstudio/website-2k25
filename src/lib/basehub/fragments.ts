import { fragmentOn } from "basehub"

export const IMAGE_FRAGMENT = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true
})

export type ImageFragment = fragmentOn.infer<typeof IMAGE_FRAGMENT>
