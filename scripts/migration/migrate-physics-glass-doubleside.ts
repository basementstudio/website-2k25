import 'dotenv/config'
import { queryBaseHub } from './basehub-client'
import { sanityWriteClient } from './sanity-client'

/**
 * Migrate physicsParams, glassMaterials, and doubleSideElements from BaseHub to Sanity (US-015).
 *
 * - physicsParams from threeDInteractions.physicsParams.items
 * - glassMaterials from threeDInteractions.map.glassMaterials.items
 * - doubleSideElements from threeDInteractions.map.doubleSideElements.items
 *
 * No file uploads needed — all fields are purely structured data (strings + numbers).
 *
 * Run: pnpm exec tsx scripts/migration/migrate-physics-glass-doubleside.ts
 */

async function main() {
  console.log('=== Migrate physicsParams, glassMaterials, doubleSideElements ===\n')

  // 1. Fetch data from BaseHub
  console.log('Fetching data from BaseHub...')
  const data = await queryBaseHub((client) =>
    client.query({
      threeDInteractions: {
        map: {
          glassMaterials: {
            items: {
              _title: true,
            },
          },
          doubleSideElements: {
            items: {
              _title: true,
            },
          },
        },
        physicsParams: {
          items: {
            _title: true,
            value: true,
          },
        },
      },
    })
  )

  // 2. Transform to Sanity schema shapes
  const glassMaterials: string[] =
    data.threeDInteractions.map.glassMaterials.items.map(
      (item: any) => item._title
    )

  const doubleSideElements: string[] =
    data.threeDInteractions.map.doubleSideElements.items.map(
      (item: any) => item._title
    )

  const physicsParams = data.threeDInteractions.physicsParams.items.map(
    (item: any) => ({
      _key: slugify(item._title),
      title: item._title,
      value: item.value ?? 0,
    })
  )

  console.log(`  glassMaterials: ${glassMaterials.length} items`)
  for (const name of glassMaterials) {
    console.log(`    - ${name}`)
  }

  console.log(`  doubleSideElements: ${doubleSideElements.length} items`)
  for (const name of doubleSideElements) {
    console.log(`    - ${name}`)
  }

  console.log(`  physicsParams: ${physicsParams.length} items`)
  for (const param of physicsParams) {
    console.log(`    - ${param.title}: ${param.value}`)
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

  // 4. Patch fields into the document
  console.log(`Patching fields into document ${doc._id}...`)
  await sanityWriteClient
    .patch(doc._id)
    .set({ glassMaterials, doubleSideElements, physicsParams })
    .commit()

  console.log('\n=== Migration Complete ===')
  console.log(`glassMaterials: ${glassMaterials.length}`)
  console.log(`doubleSideElements: ${doubleSideElements.length}`)
  console.log(`physicsParams: ${physicsParams.length}`)
  console.log('=== Done ===')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
