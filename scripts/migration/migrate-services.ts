import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import { convertRichText } from './utils/rich-text'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function migrateAwards() {
  console.log('  Fetching awards...')

  const data = await basehubClient.query({
    company: {
      awards: {
        awardList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            date: true,
            awardUrl: true,
            project: {
              _slug: true,
            },
            certificate: {
              url: true,
              alt: true,
            },
          },
        },
      },
    },
  })

  const awards = data.company.awards.awardList.items
  console.log(`  Found ${awards.length} awards`)

  let count = 0
  for (const award of awards) {
    const slug = award._slug || slugify(award._title)

    // Download and upload certificate image if available
    let certificate = undefined
    if (award.certificate?.url) {
      const certRef = await downloadAndUploadImage(
        award.certificate.url,
        `${slug}-certificate`
      )
      if (certRef) certificate = certRef
    }

    // Build project reference if available
    const projectRef = award.project?._slug
      ? {
          _type: 'reference' as const,
          _ref: `project-${award.project._slug}`,
        }
      : undefined

    await sanityWriteClient.createOrReplace({
      _id: `award-${slug}`,
      _type: 'award',
      title: award._title,
      date: award.date || undefined,
      awardUrl: award.awardUrl || undefined,
      ...(projectRef ? { project: projectRef } : {}),
      ...(certificate ? { certificate } : {}),
    })
    count++
  }

  console.log(`  Created ${count} award documents`)
  return count
}

async function migrateTestimonials() {
  console.log('  Fetching testimonials...')

  const data = await basehubClient.query({
    company: {
      testimonials: {
        items: {
          _id: true,
          _title: true,
          _slug: true,
          handle: true,
          content: true,
          avatar: {
            url: true,
            alt: true,
          },
          date: true,
          role: true,
        },
      },
    },
  })

  const testimonials = data.company.testimonials.items
  console.log(`  Found ${testimonials.length} testimonials`)

  let count = 0
  for (const t of testimonials) {
    const slug = t._slug || slugify(t._title)

    // Download and upload avatar if available
    let avatar = undefined
    if (t.avatar?.url) {
      const avatarRef = await downloadAndUploadImage(
        t.avatar.url,
        `${slug}-avatar`
      )
      if (avatarRef) avatar = avatarRef
    }

    await sanityWriteClient.createOrReplace({
      _id: `testimonial-${slug}`,
      _type: 'testimonial',
      name: t._title,
      handle: t.handle || undefined,
      content: t.content || undefined,
      date: t.date || undefined,
      role: t.role || undefined,
      ...(avatar ? { avatar } : {}),
    })
    count++
  }

  console.log(`  Created ${count} testimonial documents`)
  return count
}

async function migrateValues() {
  console.log('  Fetching values...')

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
  for (const v of values) {
    const slug = v._slug || slugify(v._title)

    // Convert description rich text
    let description = undefined
    if (v.description?.json?.content) {
      const converted = await convertRichText(v.description.json)
      if (converted.length > 0) description = converted
    }

    // Download and upload image if available
    let image = undefined
    if (v.image?.url) {
      const imageRef = await downloadAndUploadImage(
        v.image.url,
        `${slug}-value`
      )
      if (imageRef) image = imageRef
    }

    await sanityWriteClient.createOrReplace({
      _id: `value-${slug}`,
      _type: 'value',
      title: v._title,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    })
    count++
  }

  console.log(`  Created ${count} value documents`)
  return count
}

export default async function migrateServices() {
  const awardCount = await migrateAwards()
  const testimonialCount = await migrateTestimonials()
  const valueCount = await migrateValues()
  console.log(
    `  Summary: ${awardCount} awards, ${testimonialCount} testimonials, ${valueCount} values migrated`
  )
}
