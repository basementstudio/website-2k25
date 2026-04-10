import 'dotenv/config'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadFile } from './utils/files'

/**
 * Fix data issues in threeDAssets document after migration (US-016).
 *
 * Fixes:
 * 1. Retry failed sfx.blog.door[2].close upload
 * 2. Clean empty string "" values in bakes (lightmap/ambientOcclusion) → unset
 * 3. Clean empty string "" values in inspectables (fx) → unset
 * 4. Add missing _key to sfx.blog.lockedDoor items
 * 5. Add missing _key to sfx.blog.door items
 *
 * Run: pnpm exec tsx scripts/migration/fix-3d-assets-data.ts
 */

function generateKey(prefix: string, index: number): string {
  return `${prefix}-${index}`
}

async function main() {
  console.log('=== Fix 3D Assets Data (US-016) ===\n')

  const doc = await sanityWriteClient.fetch(
    `*[_type == "threeDAssets"][0]`
  )

  if (!doc) {
    console.error('No threeDAssets document found!')
    process.exit(1)
  }

  const patches: Record<string, any> = {}
  const unsetPaths: string[] = []

  // --- 1. Retry failed sfx.blog.door[2].close ---
  console.log('--- Fix 1: Retry sfx.blog.door[2].close ---')
  const doorItems = doc.sfx?.blog?.door || []
  const door2Close = doorItems[2]?.close
  if (typeof door2Close === 'string' && door2Close !== '') {
    console.log(`  Found raw URL: ${door2Close}`)
    try {
      const ref = await downloadAndUploadFile(door2Close)
      if (ref) {
        // Rebuild the full door array with the fix
        const fixedDoor = doorItems.map((item: any, i: number) => ({
          ...item,
          _key: item._key || generateKey('door', i),
          ...(i === 2 ? { close: ref } : {}),
        }))
        patches['sfx.blog.door'] = fixedDoor
        console.log('  ✓ Uploaded and patched door[2].close')
      }
    } catch (err) {
      console.error(`  ✗ Failed again: ${err}`)
    }
  } else if (door2Close && typeof door2Close === 'object') {
    console.log('  Already a file reference, skipping')
  } else {
    console.log('  No raw URL found, skipping')
  }

  // Also ensure all door items have _key
  if (!patches['sfx.blog.door']) {
    const needsKeys = doorItems.some((item: any) => !item._key)
    if (needsKeys) {
      patches['sfx.blog.door'] = doorItems.map((item: any, i: number) => ({
        ...item,
        _key: item._key || generateKey('door', i),
      }))
      console.log('  ✓ Added missing _key to door items')
    }
  }

  // --- 2. Clean empty strings in bakes ---
  console.log('\n--- Fix 2: Clean empty strings in bakes ---')
  const bakes = doc.bakes || []
  let bakesFixed = 0
  const fixedBakes = bakes.map((bake: any, i: number) => {
    const fixed = { ...bake }
    if (!fixed._key) {
      fixed._key = generateKey('bake', i)
    }
    if (typeof fixed.lightmap === 'string') {
      delete fixed.lightmap
      bakesFixed++
      console.log(`  ✓ Removed empty string lightmap from bake[${i}] "${fixed.title}"`)
    }
    if (typeof fixed.ambientOcclusion === 'string') {
      delete fixed.ambientOcclusion
      bakesFixed++
      console.log(`  ✓ Removed empty string ambientOcclusion from bake[${i}] "${fixed.title}"`)
    }
    return fixed
  })
  if (bakesFixed > 0) {
    patches['bakes'] = fixedBakes
    console.log(`  Fixed ${bakesFixed} empty string fields in bakes`)
  } else {
    console.log('  No empty strings found in bakes')
  }

  // --- 3. Clean empty strings in inspectables ---
  console.log('\n--- Fix 3: Clean empty strings in inspectables ---')
  const inspectables = doc.inspectables || []
  let inspectablesFixed = 0
  const fixedInspectables = inspectables.map((item: any) => {
    const fixed = { ...item }
    if (typeof fixed.fx === 'string') {
      delete fixed.fx
      inspectablesFixed++
      console.log(`  ✓ Removed empty string fx from "${fixed.title}"`)
    }
    return fixed
  })
  if (inspectablesFixed > 0) {
    patches['inspectables'] = fixedInspectables
    console.log(`  Fixed ${inspectablesFixed} empty string fx fields in inspectables`)
  } else {
    console.log('  No empty strings found in inspectables')
  }

  // --- 4. Add missing _key to lockedDoor items ---
  console.log('\n--- Fix 4: Add missing _key to lockedDoor items ---')
  const lockedDoor = doc.sfx?.blog?.lockedDoor || []
  const lockedDoorNeedsKeys = lockedDoor.some((item: any) => !item._key)
  if (lockedDoorNeedsKeys) {
    const fixedLockedDoor = lockedDoor.map((item: any, i: number) => {
      if (typeof item === 'object' && item !== null) {
        return {
          ...item,
          _key: item._key || generateKey('locked-door', i),
        }
      }
      // If it's still a raw value somehow, just add _key
      return item
    })
    patches['sfx.blog.lockedDoor'] = fixedLockedDoor
    console.log(`  ✓ Added _key to ${lockedDoor.length} lockedDoor items`)
  } else {
    console.log('  All lockedDoor items already have _key')
  }

  // --- 5. Ensure lamp, buttons, sticks items have _key ---
  console.log('\n--- Fix 5: Ensure _key on lamp, buttons, sticks ---')
  const lampItems = doc.sfx?.blog?.lamp || []
  if (lampItems.some((item: any) => !item._key)) {
    patches['sfx.blog.lamp'] = lampItems.map((item: any, i: number) => ({
      ...item,
      _key: item._key || generateKey('lamp', i),
    }))
    console.log(`  ✓ Added _key to lamp items`)
  }

  const buttonItems = doc.sfx?.arcade?.buttons || []
  if (buttonItems.some((item: any) => !item._key)) {
    patches['sfx.arcade.buttons'] = buttonItems.map((item: any, i: number) => ({
      ...item,
      _key: item._key || generateKey('button', i),
    }))
    console.log(`  ✓ Added _key to button items`)
  }

  const stickItems = doc.sfx?.arcade?.sticks || []
  if (stickItems.some((item: any) => !item._key)) {
    patches['sfx.arcade.sticks'] = stickItems.map((item: any, i: number) => ({
      ...item,
      _key: item._key || generateKey('stick', i),
    }))
    console.log(`  ✓ Added _key to stick items`)
  }

  // --- Apply patches ---
  const patchKeys = Object.keys(patches)
  if (patchKeys.length === 0 && unsetPaths.length === 0) {
    console.log('\n✓ No fixes needed - document is clean!')
    return
  }

  console.log(`\nApplying ${patchKeys.length} patches...`)
  let patch = sanityWriteClient.patch(doc._id)

  if (patchKeys.length > 0) {
    patch = patch.set(patches)
  }
  if (unsetPaths.length > 0) {
    patch = patch.unset(unsetPaths)
  }

  await patch.commit()

  console.log('\n=== Fix Complete ===')
  console.log(`Patches applied: ${patchKeys.join(', ')}`)
  if (unsetPaths.length > 0) {
    console.log(`Unset paths: ${unsetPaths.join(', ')}`)
  }
}

main().catch((err) => {
  console.error('Fix script failed:', err)
  process.exit(1)
})
