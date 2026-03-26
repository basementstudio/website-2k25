import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function migrateLab() {
  console.log('  Fetching lab projects...')

  const data = await basehubClient.query({
    pages: {
      laboratory: {
        projectList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            url: true,
            description: true,
            cover: {
              url: true,
              alt: true,
            },
          },
        },
      },
    },
  })

  const projects = data.pages.laboratory.projectList.items
  console.log(`  Found ${projects.length} lab projects`)

  let count = 0
  for (const project of projects) {
    const slug = project._slug || slugify(project._title)

    // Download and upload cover image
    const cover = await downloadAndUploadImage(
      project.cover?.url,
      `lab-${slug}-cover`
    )

    await sanityWriteClient.createOrReplace({
      _id: `labProject-${slug}`,
      _type: 'labProject',
      title: project._title,
      url: project.url || undefined,
      description: project.description || undefined,
      ...(cover ? { cover } : {}),
    })
    count++
  }

  console.log(`  Created ${count} lab project documents`)
  return count
}
