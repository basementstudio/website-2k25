import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import {
  downloadAndUploadImage,
  uploadImageToSanity,
} from './utils/images'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function fetchClients() {
  // BaseHub logo field is a scalar (URL string) per the SDK types.
  // Query with `logo: true` and normalize whatever comes back.
  const data = await basehubClient.query({
    company: {
      clients: {
        clientList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            logo: true,
            website: true,
          },
        },
      },
    },
  })

  const raw = data.company.clients.clientList.items

  // Log first client to verify field structure
  if (raw.length > 0) {
    console.log(
      '  Sample client:',
      JSON.stringify(raw[0], null, 2).slice(0, 300)
    )
  }

  // Normalize: logo could be a string URL, an object with { url }, or null
  return raw.map((c) => {
    const logo = c.logo as unknown
    let logoUrl: string | null = null
    if (typeof logo === 'string' && logo.length > 0) {
      logoUrl = logo
    } else if (logo && typeof logo === 'object' && 'url' in logo) {
      const url = (logo as { url?: string }).url
      if (typeof url === 'string' && url.length > 0) logoUrl = url
    }
    return {
      _id: c._id as string,
      _title: c._title as string,
      _slug: c._slug as string,
      logoUrl,
      website: (c.website as string | null) || null,
    }
  })
}

async function fixClients() {
  console.log('=== Fix Clients ===')
  console.log('  Fetching clients from BaseHub...')

  const clients = await fetchClients()
  console.log(`  Found ${clients.length} clients`)

  let successCount = 0
  let logoCount = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const client of clients) {
    const slug = client._slug || slugify(client._title)
    const docId = `client-${slug}`

    try {
      // Upload logo if available — may be a URL or inline SVG string
      let logo = undefined
      if (client.logoUrl) {
        try {
          if (
            client.logoUrl.startsWith('http://') ||
            client.logoUrl.startsWith('https://')
          ) {
            const logoRef = await downloadAndUploadImage(
              client.logoUrl,
              `${slug}-logo`
            )
            if (logoRef) {
              logo = logoRef
              logoCount++
            }
          } else if (client.logoUrl.startsWith('<svg')) {
            // Inline SVG — upload directly as buffer
            const buffer = Buffer.from(client.logoUrl, 'utf-8')
            const logoRef = await uploadImageToSanity(buffer, `${slug}-logo.svg`)
            logo = logoRef
            logoCount++
          }
        } catch (imgErr) {
          console.warn(
            `    ⚠ Logo upload failed for ${docId}: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`
          )
        }
      }

      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'client',
        title: client._title,
        website: client.website || undefined,
        ...(logo ? { logo } : {}),
      })

      successCount++
      console.log(
        `  ✓ ${docId} — ${client._title}${logo ? ' (with logo)' : ''}`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  console.log('\n=== Summary ===')
  console.log(`  Total clients: ${clients.length}`)
  console.log(`  Created: ${successCount}`)
  console.log(`  Logos uploaded: ${logoCount}`)
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    for (const e of errors) {
      console.log(`    - ${e.id}: ${e.error}`)
    }
  }

  return successCount
}

fixClients()
  .then((count) => {
    console.log(`\nDone. ${count} clients created.`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
