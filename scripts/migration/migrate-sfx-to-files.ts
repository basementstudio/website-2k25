import 'dotenv/config'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadFile } from './utils/files'
import type { SanityFileRef } from './utils/files'

/**
 * Migrate SFX audio URLs to Sanity file storage (US-012).
 * Processes all sfx fields in the threeDAssets document.
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

/** Helper: keep existing value if migration returned null */
const fileOrKeep = (ref: SanityFileRef | null, existing: any) =>
  ref ?? existing

async function main() {
  console.log('=== Migrating SFX audio assets to Sanity file storage (US-012) ===')
  console.log('Fetching current threeDAssets document from Sanity...\n')

  const doc = await sanityWriteClient.fetch(
    `*[_type == "threeDAssets"][0]`
  )

  if (!doc) {
    console.error('No threeDAssets document found in Sanity!')
    process.exit(1)
  }

  const sfx = doc.sfx
  if (!sfx) {
    console.error('No sfx field found in threeDAssets document!')
    process.exit(1)
  }

  console.log('Found threeDAssets document. Starting SFX file migrations...\n')

  // --- Top-level sfx fields ---
  console.log('--- Basketball sounds ---')
  const basketballTheme = await migrateField('sfx.basketballTheme', sfx.basketballTheme)
  const basketballSwoosh = await migrateField('sfx.basketballSwoosh', sfx.basketballSwoosh)
  const basketballNetSfx = await migrateField('sfx.basketballNet', sfx.basketballNet)
  const basketballThump = await migrateField('sfx.basketballThump', sfx.basketballThump)
  const basketballBuzzer = await migrateField('sfx.basketballBuzzer', sfx.basketballBuzzer)
  const basketballStreak = await migrateField('sfx.basketballStreak', sfx.basketballStreak)

  console.log('\n--- Misc sounds ---')
  const knobTurning = await migrateField('sfx.knobTurning', sfx.knobTurning)
  const antenna = await migrateField('sfx.antenna', sfx.antenna)

  // --- Blog sounds ---
  console.log('\n--- Blog: lockedDoor ---')
  const lockedDoorItems = sfx.blog?.lockedDoor || []
  const lockedDoorRefs: (SanityFileRef | null)[] = []
  for (let i = 0; i < lockedDoorItems.length; i++) {
    // lockedDoor is an array of bare URL strings (not objects)
    const url = typeof lockedDoorItems[i] === 'string' ? lockedDoorItems[i] : null
    const ref = await migrateField(`sfx.blog.lockedDoor[${i}]`, url)
    lockedDoorRefs.push(ref)
  }

  console.log('\n--- Blog: door ---')
  const doorItems = sfx.blog?.door || []
  const doorRefs: { open: SanityFileRef | null; close: SanityFileRef | null }[] = []
  for (let i = 0; i < doorItems.length; i++) {
    const open = await migrateField(
      `sfx.blog.door[${i}].open`,
      typeof doorItems[i]?.open === 'string' ? doorItems[i].open : null
    )
    const close = await migrateField(
      `sfx.blog.door[${i}].close`,
      typeof doorItems[i]?.close === 'string' ? doorItems[i].close : null
    )
    doorRefs.push({ open, close })
  }

  console.log('\n--- Blog: lamp ---')
  const lampItems = sfx.blog?.lamp || []
  const lampRefs: { pull: SanityFileRef | null; release: SanityFileRef | null }[] = []
  for (let i = 0; i < lampItems.length; i++) {
    const pull = await migrateField(
      `sfx.blog.lamp[${i}].pull`,
      typeof lampItems[i]?.pull === 'string' ? lampItems[i].pull : null
    )
    const release = await migrateField(
      `sfx.blog.lamp[${i}].release`,
      typeof lampItems[i]?.release === 'string' ? lampItems[i].release : null
    )
    lampRefs.push({ pull, release })
  }

  // --- Arcade sounds ---
  console.log('\n--- Arcade: buttons ---')
  const buttonItems = sfx.arcade?.buttons || []
  const buttonRefs: { press: SanityFileRef | null; release: SanityFileRef | null }[] = []
  for (let i = 0; i < buttonItems.length; i++) {
    const press = await migrateField(
      `sfx.arcade.buttons[${i}].press`,
      typeof buttonItems[i]?.press === 'string' ? buttonItems[i].press : null
    )
    const release = await migrateField(
      `sfx.arcade.buttons[${i}].release`,
      typeof buttonItems[i]?.release === 'string' ? buttonItems[i].release : null
    )
    buttonRefs.push({ press, release })
  }

  console.log('\n--- Arcade: sticks ---')
  const stickItems = sfx.arcade?.sticks || []
  const stickRefs: { press: SanityFileRef | null; release: SanityFileRef | null }[] = []
  for (let i = 0; i < stickItems.length; i++) {
    const press = await migrateField(
      `sfx.arcade.sticks[${i}].press`,
      typeof stickItems[i]?.press === 'string' ? stickItems[i].press : null
    )
    const release = await migrateField(
      `sfx.arcade.sticks[${i}].release`,
      typeof stickItems[i]?.release === 'string' ? stickItems[i].release : null
    )
    stickRefs.push({ press, release })
  }

  console.log('\n--- Arcade: miamiHeatwave ---')
  const miamiHeatwave = await migrateField('sfx.arcade.miamiHeatwave', sfx.arcade?.miamiHeatwave)

  // --- Music ---
  console.log('\n--- Music ---')
  const musicAqua = await migrateField('sfx.music.aqua', sfx.music?.aqua)
  const musicRain = await migrateField('sfx.music.rain', sfx.music?.rain)
  const musicTiger = await migrateField('sfx.music.tiger', sfx.music?.tiger)
  const musicVhs = await migrateField('sfx.music.vhs', sfx.music?.vhs)

  // --- Contact ---
  console.log('\n--- Contact ---')
  const contactInterference = await migrateField('sfx.contact.interference', sfx.contact?.interference)

  // --- Build the updated sfx object ---
  console.log('\n\nBuilding updated sfx object...')

  const updatedLockedDoor = lockedDoorItems.map((item: any, i: number) =>
    fileOrKeep(lockedDoorRefs[i] ?? null, item)
  )

  const updatedDoor = doorItems.map((item: any, i: number) => ({
    ...item,
    open: fileOrKeep(doorRefs[i]?.open ?? null, item.open),
    close: fileOrKeep(doorRefs[i]?.close ?? null, item.close),
  }))

  const updatedLamp = lampItems.map((item: any, i: number) => ({
    ...item,
    pull: fileOrKeep(lampRefs[i]?.pull ?? null, item.pull),
    release: fileOrKeep(lampRefs[i]?.release ?? null, item.release),
  }))

  const updatedButtons = buttonItems.map((item: any, i: number) => ({
    ...item,
    press: fileOrKeep(buttonRefs[i]?.press ?? null, item.press),
    release: fileOrKeep(buttonRefs[i]?.release ?? null, item.release),
  }))

  const updatedSticks = stickItems.map((item: any, i: number) => ({
    ...item,
    press: fileOrKeep(stickRefs[i]?.press ?? null, item.press),
    release: fileOrKeep(stickRefs[i]?.release ?? null, item.release),
  }))

  const updatedSfx = {
    ...sfx,
    basketballTheme: fileOrKeep(basketballTheme, sfx.basketballTheme),
    basketballSwoosh: fileOrKeep(basketballSwoosh, sfx.basketballSwoosh),
    basketballNet: fileOrKeep(basketballNetSfx, sfx.basketballNet),
    basketballThump: fileOrKeep(basketballThump, sfx.basketballThump),
    basketballBuzzer: fileOrKeep(basketballBuzzer, sfx.basketballBuzzer),
    basketballStreak: fileOrKeep(basketballStreak, sfx.basketballStreak),
    knobTurning: fileOrKeep(knobTurning, sfx.knobTurning),
    antenna: fileOrKeep(antenna, sfx.antenna),
    blog: {
      ...sfx.blog,
      lockedDoor: updatedLockedDoor,
      door: updatedDoor,
      lamp: updatedLamp,
    },
    arcade: {
      ...sfx.arcade,
      buttons: updatedButtons,
      sticks: updatedSticks,
      miamiHeatwave: fileOrKeep(miamiHeatwave, sfx.arcade?.miamiHeatwave),
    },
    music: {
      ...sfx.music,
      aqua: fileOrKeep(musicAqua, sfx.music?.aqua),
      rain: fileOrKeep(musicRain, sfx.music?.rain),
      tiger: fileOrKeep(musicTiger, sfx.music?.tiger),
      vhs: fileOrKeep(musicVhs, sfx.music?.vhs),
    },
    contact: {
      ...sfx.contact,
      interference: fileOrKeep(contactInterference, sfx.contact?.interference),
    },
  }

  console.log('Patching sfx field in threeDAssets document...')
  await sanityWriteClient
    .patch(doc._id)
    .set({ sfx: updatedSfx })
    .commit()

  // --- Summary ---
  console.log('\n=== SFX Migration Summary ===')
  console.log(`Total attempted: ${stats.attempted}`)
  console.log(`Succeeded: ${stats.succeeded}`)
  console.log(`Failed: ${stats.failed}`)
  if (stats.failedFields.length > 0) {
    console.log(`Failed fields: ${stats.failedFields.join(', ')}`)
  }
  console.log('=== Done ===')
}

main().catch((err) => {
  console.error('SFX Migration failed:', err)
  process.exit(1)
})
