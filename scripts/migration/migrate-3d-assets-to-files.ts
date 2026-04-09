import 'dotenv/config'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadFile } from './utils/files'
import type { SanityFileRef } from './utils/files'

/**
 * Migrate top-level and nested 3D asset URLs to Sanity file storage.
 * Does NOT include sfx fields (handled by US-012).
 */

interface MigrationStats {
  attempted: number
  succeeded: number
  failed: number
  failedFields: string[]
}

const stats: MigrationStats = {
  attempted: 0,
  succeeded: 0,
  failed: 0,
  failedFields: [],
}

async function migrateField(
  fieldPath: string,
  url: string | undefined | null
): Promise<SanityFileRef | null> {
  if (!url || url === '') {
    console.log(`  Skipping ${fieldPath}: no URL`)
    return null
  }

  stats.attempted++
  try {
    const result = await downloadAndUploadFile(url)
    if (result) {
      stats.succeeded++
      console.log(`  ✓ ${fieldPath}`)
    }
    // Rate limit: 100ms between uploads
    await new Promise((resolve) => setTimeout(resolve, 100))
    return result
  } catch (error) {
    stats.failed++
    stats.failedFields.push(fieldPath)
    console.error(`  ✗ ${fieldPath}: ${error}`)
    return null
  }
}

async function migrateArrayField(
  basePath: string,
  items: any[] | undefined,
  urlFieldName: string
): Promise<(SanityFileRef | null)[]> {
  if (!items || !Array.isArray(items)) return []
  const results: (SanityFileRef | null)[] = []
  for (let i = 0; i < items.length; i++) {
    const url = items[i]?.[urlFieldName]
    const ref = await migrateField(
      `${basePath}[${i}].${urlFieldName}`,
      typeof url === 'string' ? url : null
    )
    results.push(ref)
  }
  return results
}

async function main() {
  console.log('=== Migrating 3D assets to Sanity file storage (US-011) ===')
  console.log('Fetching current threeDAssets document from Sanity...\n')

  const doc = await sanityWriteClient.fetch(
    `*[_type == "threeDAssets"][0]`
  )

  if (!doc) {
    console.error('No threeDAssets document found in Sanity!')
    process.exit(1)
  }

  console.log('Found threeDAssets document. Starting file migrations...\n')

  // --- Top-level models ---
  console.log('--- Top-level models ---')
  const officeItems = await migrateField('officeItems', doc.officeItems)
  const office = await migrateField('office', doc.office)
  const officeWireframe = await migrateField('officeWireframe', doc.officeWireframe)
  const outdoor = await migrateField('outdoor', doc.outdoor)
  const godrays = await migrateField('godrays', doc.godrays)
  const basketball = await migrateField('basketball', doc.basketball)
  const basketballNet = await migrateField('basketballNet', doc.basketballNet)
  const contactPhone = await migrateField('contactPhone', doc.contactPhone)
  const routingElements = await migrateField('routingElements', doc.routingElements)
  const outdoorCars = await migrateField('outdoorCars', doc.outdoorCars)

  // --- Special Events ---
  console.log('\n--- Special Events ---')
  const christmasTree = await migrateField(
    'specialEvents.christmas.tree',
    doc.specialEvents?.christmas?.tree
  )
  const christmasSong = await migrateField(
    'specialEvents.christmas.song',
    doc.specialEvents?.christmas?.song
  )

  // --- Bakes ---
  console.log('\n--- Bakes ---')
  const bakesItems = doc.bakes || []
  const bakesLightmaps = await migrateArrayField('bakes', bakesItems, 'lightmap')
  const bakesAO = await migrateArrayField('bakes', bakesItems, 'ambientOcclusion')

  // --- Matcaps ---
  console.log('\n--- Matcaps ---')
  const matcapsFiles = await migrateArrayField('matcaps', doc.matcaps, 'file')

  // --- Glass Reflexes ---
  console.log('\n--- Glass Reflexes ---')
  const glassReflexesFiles = await migrateArrayField('glassReflexes', doc.glassReflexes, 'url')

  // --- Arcade ---
  console.log('\n--- Arcade ---')
  const arcadeIdleScreen = await migrateField('arcade.idleScreen', doc.arcade?.idleScreen)
  const arcadePlaceholderLab = await migrateField('arcade.placeholderLab', doc.arcade?.placeholderLab)
  const arcadeBoot = await migrateField('arcade.boot', doc.arcade?.boot)
  const arcadeChronicles = await migrateField('arcade.chronicles', doc.arcade?.chronicles)
  const arcadeLooper = await migrateField('arcade.looper', doc.arcade?.looper)
  const arcadePalm = await migrateField('arcade.palm', doc.arcade?.palm)
  const arcadeSkybox = await migrateField('arcade.skybox', doc.arcade?.skybox)
  const arcadeCityscape = await migrateField('arcade.cityscape', doc.arcade?.cityscape)
  const arcadeIntroScreen = await migrateField('arcade.introScreen', doc.arcade?.introScreen)

  // --- Videos ---
  console.log('\n--- Videos ---')
  const videosFiles = await migrateArrayField('videos', doc.videos, 'url')

  // --- Characters ---
  console.log('\n--- Characters ---')
  const charsModel = await migrateField('characters.model', doc.characters?.model)
  const charsTextureBody = await migrateField('characters.textureBody', doc.characters?.textureBody)
  const charsTextureFaces = await migrateField('characters.textureFaces', doc.characters?.textureFaces)
  const charsTextureArms = await migrateField('characters.textureArms', doc.characters?.textureArms)
  const charsTextureComic = await migrateField('characters.textureComic', doc.characters?.textureComic)

  // --- Pets ---
  console.log('\n--- Pets ---')
  const petsModel = await migrateField('pets.model', doc.pets?.model)
  const petsPureTexture = await migrateField('pets.pureTexture', doc.pets?.pureTexture)
  const petsBostonTexture = await migrateField('pets.bostonTexture', doc.pets?.bostonTexture)

  // --- Lamp ---
  console.log('\n--- Lamp ---')
  const lampExtraLightmap = await migrateField('lamp.extraLightmap', doc.lamp?.extraLightmap)

  // --- Map Textures ---
  console.log('\n--- Map Textures ---')
  const mapTexturesRain = await migrateField('mapTextures.rain', doc.mapTextures?.rain)
  const mapTexturesBasketballVa = await migrateField('mapTextures.basketballVa', doc.mapTextures?.basketballVa)

  // --- Build the updated document ---
  console.log('\n\nBuilding updated document...')

  // Helper: keep existing value if migration returned null (failed or no URL)
  const fileOrKeep = (ref: SanityFileRef | null, existing: any) =>
    ref ?? existing

  const updatedBakes = bakesItems.map((item: any, i: number) => ({
    ...item,
    lightmap: fileOrKeep(bakesLightmaps[i] ?? null, item.lightmap),
    ambientOcclusion: fileOrKeep(bakesAO[i] ?? null, item.ambientOcclusion),
  }))

  const updatedMatcaps = (doc.matcaps || []).map((item: any, i: number) => ({
    ...item,
    file: fileOrKeep(matcapsFiles[i] ?? null, item.file),
  }))

  const updatedGlassReflexes = (doc.glassReflexes || []).map(
    (item: any, i: number) => ({
      ...item,
      url: fileOrKeep(glassReflexesFiles[i] ?? null, item.url),
    })
  )

  const updatedVideos = (doc.videos || []).map((item: any, i: number) => ({
    ...item,
    url: fileOrKeep(videosFiles[i] ?? null, item.url),
  }))

  const updatedDoc = {
    _id: doc._id,
    _type: 'threeDAssets',

    // Top-level models
    officeItems: fileOrKeep(officeItems, doc.officeItems),
    office: fileOrKeep(office, doc.office),
    officeWireframe: fileOrKeep(officeWireframe, doc.officeWireframe),
    outdoor: fileOrKeep(outdoor, doc.outdoor),
    godrays: fileOrKeep(godrays, doc.godrays),
    basketball: fileOrKeep(basketball, doc.basketball),
    basketballNet: fileOrKeep(basketballNet, doc.basketballNet),
    contactPhone: fileOrKeep(contactPhone, doc.contactPhone),
    routingElements: fileOrKeep(routingElements, doc.routingElements),
    outdoorCars: fileOrKeep(outdoorCars, doc.outdoorCars),

    // Special Events
    specialEvents: {
      ...doc.specialEvents,
      christmas: {
        ...doc.specialEvents?.christmas,
        tree: fileOrKeep(christmasTree, doc.specialEvents?.christmas?.tree),
        song: fileOrKeep(christmasSong, doc.specialEvents?.christmas?.song),
      },
    },

    // Bakes
    bakes: updatedBakes,

    // Matcaps
    matcaps: updatedMatcaps,

    // Glass Reflexes
    glassReflexes: updatedGlassReflexes,

    // Arcade
    arcade: {
      ...doc.arcade,
      idleScreen: fileOrKeep(arcadeIdleScreen, doc.arcade?.idleScreen),
      placeholderLab: fileOrKeep(arcadePlaceholderLab, doc.arcade?.placeholderLab),
      boot: fileOrKeep(arcadeBoot, doc.arcade?.boot),
      chronicles: fileOrKeep(arcadeChronicles, doc.arcade?.chronicles),
      looper: fileOrKeep(arcadeLooper, doc.arcade?.looper),
      palm: fileOrKeep(arcadePalm, doc.arcade?.palm),
      skybox: fileOrKeep(arcadeSkybox, doc.arcade?.skybox),
      cityscape: fileOrKeep(arcadeCityscape, doc.arcade?.cityscape),
      introScreen: fileOrKeep(arcadeIntroScreen, doc.arcade?.introScreen),
    },

    // Videos
    videos: updatedVideos,

    // Characters
    characters: {
      ...doc.characters,
      model: fileOrKeep(charsModel, doc.characters?.model),
      textureBody: fileOrKeep(charsTextureBody, doc.characters?.textureBody),
      textureFaces: fileOrKeep(charsTextureFaces, doc.characters?.textureFaces),
      textureArms: fileOrKeep(charsTextureArms, doc.characters?.textureArms),
      textureComic: fileOrKeep(charsTextureComic, doc.characters?.textureComic),
    },

    // Pets
    pets: {
      ...doc.pets,
      model: fileOrKeep(petsModel, doc.pets?.model),
      pureTexture: fileOrKeep(petsPureTexture, doc.pets?.pureTexture),
      bostonTexture: fileOrKeep(petsBostonTexture, doc.pets?.bostonTexture),
    },

    // Lamp
    lamp: {
      ...doc.lamp,
      extraLightmap: fileOrKeep(lampExtraLightmap, doc.lamp?.extraLightmap),
    },

    // Map Textures
    mapTextures: {
      ...doc.mapTextures,
      rain: fileOrKeep(mapTexturesRain, doc.mapTextures?.rain),
      basketballVa: fileOrKeep(mapTexturesBasketballVa, doc.mapTextures?.basketballVa),
    },

    // Preserve non-file fields as-is
    title: doc.title,
    glassMaterials: doc.glassMaterials,
    doubleSideElements: doc.doubleSideElements,
    physicsParams: doc.physicsParams,
    scenes: doc.scenes,
    inspectables: doc.inspectables,
    sfx: doc.sfx, // Preserved as-is — migrated in US-012
  }

  console.log('Writing updated document to Sanity...')
  await sanityWriteClient.createOrReplace(updatedDoc)

  // --- Summary ---
  console.log('\n=== Migration Summary ===')
  console.log(`Total attempted: ${stats.attempted}`)
  console.log(`Succeeded: ${stats.succeeded}`)
  console.log(`Failed: ${stats.failed}`)
  if (stats.failedFields.length > 0) {
    console.log(`Failed fields: ${stats.failedFields.join(', ')}`)
  }
  console.log('=== Done ===')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
