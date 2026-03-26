import { sanityWriteClient } from '../sanity-client'

interface SanityAssetRef {
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
}

// Cache URL → asset ref to avoid re-uploading the same image
const imageCache = new Map<string, SanityAssetRef>()

/**
 * Download an image from a URL and return it as a Buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${url} (${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload an image buffer to Sanity's asset pipeline.
 * Returns a Sanity image reference object.
 */
export async function uploadImageToSanity(
  buffer: Buffer,
  filename: string
): Promise<SanityAssetRef> {
  const asset = await sanityWriteClient.assets.upload('image', buffer, {
    filename,
  })

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

/**
 * Download an image from a URL and upload it to Sanity.
 * Uses a cache to avoid re-uploading the same image URL.
 * Returns null if the URL is empty/undefined.
 */
export async function downloadAndUploadImage(
  url: string | undefined | null,
  filename?: string
): Promise<SanityAssetRef | null> {
  if (!url) return null

  // Check cache first
  const cached = imageCache.get(url)
  if (cached) return cached

  const buffer = await downloadImage(url)
  const name = filename || url.split('/').pop() || 'image'
  const ref = await uploadImageToSanity(buffer, name)

  // Cache for deduplication
  imageCache.set(url, ref)

  return ref
}

export type { SanityAssetRef }
