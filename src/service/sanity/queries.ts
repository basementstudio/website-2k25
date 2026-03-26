/**
 * Reusable GROQ projection fragments for Sanity queries.
 * Use these as inline snippets inside GROQ query strings.
 */

/** Projects an image reference into a flat shape compatible with Next.js Image. */
export const imageFragment = /* groq */ `{
  alt,
  asset->{
    url,
    metadata {
      dimensions { width, height },
      lqip
    }
  }
}`

/** Projects a video file asset into a flat shape compatible with video components. */
export const videoFragment = /* groq */ `{
  "url": asset->url,
  "mimeType": asset->mimeType
}`
