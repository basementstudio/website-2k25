import { sanityWriteClient } from '../sanity-client'

interface SanityFileRef {
  _type: 'file'
  asset: {
    _type: 'reference'
    _ref: string
  }
}

// Cache URL → asset ref to avoid re-uploading the same file
const fileCache = new Map<string, SanityFileRef>()

/**
 * Download a file from a URL and return it as a Buffer.
 */
export async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${url} (${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload a file buffer to Sanity's asset pipeline.
 * Returns a Sanity file reference object.
 */
export async function uploadFileToSanity(
  buffer: Buffer,
  filename: string
): Promise<SanityFileRef> {
  const asset = await sanityWriteClient.assets.upload('file', buffer, {
    filename,
  })

  return {
    _type: 'file',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

/**
 * Download a file from a URL and upload it to Sanity.
 * Uses a cache to avoid re-uploading the same file URL.
 * Returns null if the URL is empty/undefined.
 */
export async function downloadAndUploadFile(
  url: string | undefined | null,
  filename?: string
): Promise<SanityFileRef | null> {
  if (!url) return null

  // Check cache first
  const cached = fileCache.get(url)
  if (cached) return cached

  console.log(`  Downloading file: ${url}`)
  const buffer = await downloadFile(url)
  const name = filename || url.split('/').pop() || 'file'

  console.log(`  Uploading to Sanity: ${name}`)
  const ref = await uploadFileToSanity(buffer, name)

  // Cache for deduplication
  fileCache.set(url, ref)

  console.log(`  ✓ Uploaded: ${ref.asset._ref}`)
  return ref
}

export type { SanityFileRef }
