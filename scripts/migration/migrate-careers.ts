import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { convertRichText } from './utils/rich-text'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function migrateCareers() {
  console.log('  Fetching open positions...')

  const data = await basehubClient.query({
    company: {
      openPositions: {
        openPositionsList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            type: true,
            employmentType: true,
            location: true,
            isOpen: true,
            applyUrl: true,
            jobDescription: {
              json: {
                content: true,
              },
            },
            applyFormSetup: {
              formFields: true,
              skills: {
                items: {
                  _title: true,
                  _slug: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const positions = data.company.openPositions.openPositionsList.items
  console.log(`  Found ${positions.length} open positions`)

  let count = 0
  for (const pos of positions) {
    const slug = pos._slug || slugify(pos._title)

    // Convert job description rich text
    const jobDescription = await convertRichText(
      pos.jobDescription?.json?.content
    )

    // Build apply form setup
    let applyFormSetup = undefined
    if (pos.applyFormSetup) {
      const skills = (pos.applyFormSetup.skills?.items || []).map(
        (s: { _title?: string; _slug?: string }) => ({
          _key: s._slug || slugify(s._title || ''),
          title: s._title || '',
          slug: s._slug || slugify(s._title || ''),
        })
      )

      applyFormSetup = {
        formFields: Array.isArray(pos.applyFormSetup.formFields)
          ? pos.applyFormSetup.formFields
          : pos.applyFormSetup.formFields
            ? [pos.applyFormSetup.formFields]
            : undefined,
        ...(skills.length > 0 ? { skills } : {}),
      }
    }

    await sanityWriteClient.createOrReplace({
      _id: `openPosition-${slug}`,
      _type: 'openPosition',
      title: pos._title,
      slug: { _type: 'slug', current: slug },
      type: pos.type || undefined,
      employmentType: pos.employmentType || undefined,
      location: pos.location || undefined,
      isOpen: pos.isOpen ?? true,
      applyUrl: pos.applyUrl || undefined,
      ...(jobDescription.length > 0 ? { jobDescription } : {}),
      ...(applyFormSetup ? { applyFormSetup } : {}),
    })
    count++
  }

  console.log(`  Created ${count} open position documents`)
  return count
}
