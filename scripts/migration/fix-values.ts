import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import { convertRichText, sanitizePortableText } from './utils/rich-text'

/**
 * Fix values migration. The values step in migrate-services.ts was never reached
 * because the testimonials step crashed first. Also fixes a bug where the
 * original code passed v.description.json instead of v.description.json.content
 * to convertRichText.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-values.ts
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function fixValues() {
  console.log('=== Fix Values ===\n')
  console.log('  Fetching values from BaseHub...')

  const data = await basehubClient.query({
    company: {
      ourValues: {
        valuesList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            description: {
              json: {
                content: true,
              },
            },
            image: {
              url: true,
              alt: true,
            },
          },
        },
      },
    },
  })

  const values = data.company.ourValues.valuesList.items
  console.log(`  Found ${values.length} values`)

  let count = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const v of values) {
    const slug = v._slug || slugify(v._title)
    const docId = `value-${slug}`
    try {
      // Convert description rich text
      let description = undefined
      if (v.description?.json?.content) {
        const converted = await convertRichText(v.description.json.content)
        const sanitized = sanitizePortableText(
          converted as Array<Record<string, unknown>>,
          new Set(['block'])
        )
        if (sanitized.length > 0) description = sanitized
      }

      // Download and upload image
      let image = undefined
      if (v.image?.url) {
        try {
          image = await downloadAndUploadImage(v.image.url, `${slug}-value`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`    ⚠ Image upload failed for ${docId}: ${msg}`)
        }
      }

      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'value',
        title: v._title,
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
      })
      count++
      console.log(`  + ${docId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`\n  ⚠ ${errors.length} values failed:`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }

  console.log(`\n=== Summary ===`)
  console.log(`  Values created: ${count}/${values.length}`)
  console.log('=== Done ===')

  return count
}

fixValues()
  .then((count) => {
    console.log(`\n${count} values created.`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-values failed:', err)
    process.exit(1)
  })
