import 'dotenv/config'
import { queryBaseHub } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { convertRichText } from './utils/rich-text'
import { downloadAndUploadFile } from './utils/files'

/**
 * Migrate inspectables data from BaseHub to Sanity (US-014).
 * Fetches inspectables from pages.inspectables.inspectableList.items
 * and writes to the threeDAssets document's inspectables array field.
 *
 * Includes file uploads for fx fields and rich text conversion for descriptions.
 *
 * Run: pnpm exec tsx scripts/migration/migrate-inspectables.ts
 */

async function main() {
  console.log('=== Migrate Inspectables ===\n')

  // 1. Fetch inspectables from BaseHub
  console.log('Fetching inspectables from BaseHub...')
  const data = await queryBaseHub((client) =>
    client.query({
      pages: {
        inspectables: {
          inspectableList: {
            items: {
              _id: true,
              _title: true,
              mesh: true,
              specs: {
                items: {
                  _id: true,
                  _title: true,
                  value: true,
                },
              },
              description: {
                json: {
                  content: true,
                },
              },
              xOffset: true,
              yOffset: true,
              xRotationOffset: true,
              sizeTarget: true,
              scenes: { _title: true },
              fx: { url: true },
            },
          },
        },
      },
    })
  )

  const items = data.pages.inspectables.inspectableList.items
  console.log(`Found ${items.length} inspectables in BaseHub\n`)

  // 2. Transform to Sanity schema shape
  let succeeded = 0
  let fxFailed = 0
  const inspectables = []

  for (const item of items as any[]) {
    console.log(`Processing: "${item._title}"...`)

    // Convert rich text description
    let description: any[] = []
    try {
      description = await convertRichText(item.description?.json?.content)
    } catch (err) {
      console.warn(`  Warning: description conversion failed for "${item._title}":`, err)
    }

    // Upload fx file
    let fx = null
    const fxUrl = item.fx?.url
    if (fxUrl) {
      try {
        fx = await downloadAndUploadFile(fxUrl, `fx-${slugify(item._title)}`)
        if (fx) {
          console.log(`  FX uploaded: ${fxUrl}`)
        }
      } catch (err) {
        console.warn(`  Warning: fx upload failed for "${item._title}":`, err)
        fxFailed++
      }
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 100))

    const inspectable: any = {
      _key: slugify(item._title || item._id),
      inspectableId: item._id,
      title: item._title,
      specs: (item.specs?.items ?? []).map((spec: any) => ({
        _key: slugify(spec._title || spec._id),
        specId: spec._id,
        title: spec._title,
        value: spec.value ?? '',
      })),
      description,
      mesh: item.mesh ?? '',
      xOffset: item.xOffset ?? 0,
      yOffset: item.yOffset ?? 0,
      xRotationOffset: item.xRotationOffset ?? 0,
      sizeTarget: item.sizeTarget ?? 0,
      scenes: (item.scenes ?? []).map((s: any) => s._title),
    }

    if (fx) {
      inspectable.fx = fx
    }

    inspectables.push(inspectable)
    succeeded++
    console.log(
      `  Done: "${item._title}" (${inspectable.specs.length} specs, ${inspectable.scenes.length} scenes)`
    )
  }

  // 3. Get existing threeDAssets document
  console.log('\nFetching threeDAssets document from Sanity...')
  const doc = await sanityWriteClient.fetch(
    `*[_type == "threeDAssets"][0]{ _id }`
  )

  if (!doc) {
    console.error('No threeDAssets document found in Sanity!')
    process.exit(1)
  }

  // 4. Patch inspectables into the document
  console.log(`Patching inspectables into document ${doc._id}...`)
  await sanityWriteClient
    .patch(doc._id)
    .set({ inspectables })
    .commit()

  console.log(`\n=== Inspectables Migration Complete ===`)
  console.log(`Total inspectables: ${inspectables.length}`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`FX upload failures: ${fxFailed}`)
  console.log(
    `Total specs: ${inspectables.reduce((sum, i) => sum + i.specs.length, 0)}`
  )
  console.log('=== Done ===')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

main().catch((err) => {
  console.error('Inspectables migration failed:', err)
  process.exit(1)
})
