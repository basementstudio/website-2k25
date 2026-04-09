import 'dotenv/config'
import { queryBaseHub } from './basehub-client'
import { sanityWriteClient } from './sanity-client'

/**
 * Migrate scenes data from BaseHub to Sanity (US-013).
 * Fetches scenes from threeDInteractions.scenes.scenes.items
 * and writes to the threeDAssets document's scenes array field.
 *
 * No file uploads needed — scenes are purely structured data (strings + numbers).
 *
 * Run: pnpm exec tsx scripts/migration/migrate-scenes.ts
 */

async function main() {
  console.log('=== Migrate Scenes ===\n')

  // 1. Fetch scenes from BaseHub
  console.log('Fetching scenes from BaseHub...')
  const data = await queryBaseHub((client) =>
    client.query({
      threeDInteractions: {
        scenes: {
          scenes: {
            items: {
              _title: true,
              cameraConfig: {
                posX: true,
                posY: true,
                posZ: true,
                tarX: true,
                tarY: true,
                tarZ: true,
                fov: true,
                targetScrollY: true,
                offsetMultiplier: true,
              },
              tabs: {
                items: {
                  _title: true,
                  tabRoute: true,
                  tabHoverName: true,
                  tabClickableName: true,
                  plusShapeScale: true,
                },
              },
              postprocessing: {
                contrast: true,
                brightness: true,
                exposure: true,
                gamma: true,
                vignetteRadius: true,
                vignetteSpread: true,
                bloomStrength: true,
                bloomRadius: true,
                bloomThreshold: true,
              },
            },
          },
        },
      },
    })
  )

  const items = data.threeDInteractions.scenes.scenes.items
  console.log(`Found ${items.length} scenes in BaseHub\n`)

  // 2. Transform to Sanity schema shape
  const scenes = items.map((item: any) => ({
    _key: slugify(item._title),
    name: item._title,
    cameraConfig: {
      posX: item.cameraConfig.posX ?? 0,
      posY: item.cameraConfig.posY ?? 0,
      posZ: item.cameraConfig.posZ ?? 0,
      tarX: item.cameraConfig.tarX ?? 0,
      tarY: item.cameraConfig.tarY ?? 0,
      tarZ: item.cameraConfig.tarZ ?? 0,
      fov: item.cameraConfig.fov ?? 60,
      targetScrollY: item.cameraConfig.targetScrollY ?? -1.5,
      offsetMultiplier: item.cameraConfig.offsetMultiplier ?? 1,
    },
    tabs: item.tabs.items.map((tab: any) => ({
      _key: slugify(tab._title || tab.tabRoute || 'tab'),
      tabName: tab._title ?? '',
      tabRoute: tab.tabRoute ?? '',
      tabHoverName: tab.tabHoverName ?? '',
      tabClickableName: tab.tabClickableName ?? '',
      plusShapeScale: tab.plusShapeScale ?? 1,
    })),
    postprocessing: {
      contrast: item.postprocessing?.contrast ?? 1,
      brightness: item.postprocessing?.brightness ?? 1,
      exposure: item.postprocessing?.exposure ?? 1,
      gamma: item.postprocessing?.gamma ?? 1,
      vignetteRadius: item.postprocessing?.vignetteRadius ?? 1,
      vignetteSpread: item.postprocessing?.vignetteSpread ?? 1,
      bloomStrength: item.postprocessing?.bloomStrength ?? 1,
      bloomRadius: item.postprocessing?.bloomRadius ?? 1,
      bloomThreshold: item.postprocessing?.bloomThreshold ?? 1,
    },
  }))

  // Log scene details
  for (const scene of scenes) {
    console.log(`  Scene: "${scene.name}" (${scene.tabs.length} tabs)`)
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

  // 4. Patch scenes into the document
  console.log(`Patching scenes into document ${doc._id}...`)
  await sanityWriteClient
    .patch(doc._id)
    .set({ scenes })
    .commit()

  console.log(`\n=== Scenes Migration Complete ===`)
  console.log(`Total scenes: ${scenes.length}`)
  console.log(`Total tabs: ${scenes.reduce((sum: number, s: any) => sum + s.tabs.length, 0)}`)
  console.log('=== Done ===')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

main().catch((err) => {
  console.error('Scenes migration failed:', err)
  process.exit(1)
})
