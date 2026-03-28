import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'

/**
 * Fix testimonials migration.
 *
 * BaseHub stores testimonials as a SINGLE item at company.testimonials.services
 * (type Services_2, NOT a list). The original migration crashed because it tried
 * to use .items on a non-list type.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-testimonials.ts
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function fixTestimonials() {
  console.log('=== Fix Testimonials ===\n')
  console.log('  Fetching testimonial from BaseHub...')

  const data = await basehubClient.query({
    company: {
      testimonials: {
        services: {
          _id: true,
          _title: true,
          _slug: true,
          name: true,
          handle: true,
          handleLink: true,
          avatar: {
            url: true,
            alt: true,
          },
          content: {
            plainText: true,
          },
          date: true,
          role: {
            plainText: true,
          },
        },
      },
    },
  })

  const t = data.company.testimonials.services
  const name = t.name || t._title || ''
  const slug = t._slug || slugify(name || 'testimonial')
  const docId = `testimonial-${slug}`

  console.log(`  Found testimonial: ${name}`)

  // Download and upload avatar
  let avatar = undefined
  if (t.avatar?.url) {
    try {
      const avatarRef = await downloadAndUploadImage(
        t.avatar.url,
        `${slug}-avatar`
      )
      if (avatarRef) avatar = avatarRef
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ⚠ Avatar upload failed: ${msg}`)
    }
  }

  // Extract plain text content and role
  const content = t.content?.plainText || undefined
  const role = t.role?.plainText || undefined

  try {
    await sanityWriteClient.createOrReplace({
      _id: docId,
      _type: 'testimonial',
      name,
      handle: t.handle || undefined,
      ...(content ? { content } : {}),
      ...(avatar ? { avatar } : {}),
      date: t.date || undefined,
      ...(role ? { role } : {}),
    })
    console.log(`  + ${docId}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ! Failed ${docId}: ${msg}`)
    process.exit(1)
  }

  console.log('\n=== Summary ===')
  console.log('  Testimonials created: 1')
  console.log('=== Done ===')
}

fixTestimonials()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-testimonials failed:', err)
    process.exit(1)
  })
