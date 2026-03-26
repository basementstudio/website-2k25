import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function migratePeople() {
  console.log('  Fetching people...')

  const data = await basehubClient.query({
    company: {
      people: {
        peopleList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            department: {
              _title: true,
            },
            role: true,
            image: {
              url: true,
              alt: true,
              width: true,
              height: true,
            },
            socialNetworks: {
              items: {
                _id: true,
                platform: true,
                link: true,
              },
            },
          },
        },
      },
    },
  })

  const people = data.company.people.peopleList.items
  console.log(`  Found ${people.length} people`)

  let count = 0
  for (const person of people) {
    const slug = person._slug || slugify(person._title)

    // Download and upload person image
    let image = undefined
    if (person.image?.url) {
      const imageRef = await downloadAndUploadImage(
        person.image.url,
        `${slug}-photo`
      )
      if (imageRef) image = imageRef
    }

    // Build department reference
    const deptTitle = person.department?._title
    const deptRef = deptTitle
      ? {
          _type: 'reference' as const,
          _ref: `department-${slugify(deptTitle)}`,
        }
      : undefined

    // Build social networks array
    const socialNetworks = (person.socialNetworks?.items || [])
      .filter(
        (sn: { platform?: string; link?: string }) => sn.platform && sn.link
      )
      .map((sn: { platform?: string; link?: string; _id?: string }) => ({
        _key: sn._id || slugify(sn.platform || ''),
        _type: 'socialNetwork',
        platform: sn.platform,
        url: sn.link,
      }))

    await sanityWriteClient.createOrReplace({
      _id: `person-${slug}`,
      _type: 'person',
      title: person._title,
      role: person.role || undefined,
      ...(deptRef ? { department: deptRef } : {}),
      ...(image ? { image } : {}),
      ...(socialNetworks.length > 0 ? { socialNetworks } : {}),
    })
    count++
  }

  console.log(`  Created ${count} person documents`)
  return count
}
