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

async function migrateProjectCategories() {
  console.log('  Fetching project categories...')

  const data = await basehubClient.query({
    company: {
      projects: {
        projectCategories: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            description: true,
            subCategories: {
              items: {
                _title: true,
              },
            },
          },
        },
      },
    },
  })

  const categories = data.company.projects.projectCategories.items
  console.log(`  Found ${categories.length} project categories`)

  let count = 0
  for (const cat of categories) {
    const slug = cat._slug || slugify(cat._title)
    const subcategories = (cat.subCategories?.items || []).map(
      (sub: { _title: string }) => ({
        _key: slugify(sub._title),
        title: sub._title,
      })
    )

    await sanityWriteClient.createOrReplace({
      _id: `projectCategory-${slug}`,
      _type: 'projectCategory',
      title: cat._title,
      description: cat.description || undefined,
      ...(subcategories.length > 0 ? { subcategories } : {}),
    })
    count++
  }

  console.log(`  Created ${count} project category documents`)
  return count
}

async function migrateProjects() {
  console.log('  Fetching projects...')

  const data = await basehubClient.query({
    company: {
      projects: {
        projectList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            client: {
              _title: true,
              _slug: true,
            },
            year: true,
            categories: {
              _title: true,
              _slug: true,
            },
            projectWebsite: true,
            content: {
              json: {
                content: true,
              },
            },
            caseStudy: true,
            people: {
              _title: true,
              _slug: true,
            },
            cover: {
              url: true,
              width: true,
              height: true,
              alt: true,
            },
            coverVideo: {
              url: true,
              width: true,
              height: true,
              aspectRatio: true,
              mimeType: true,
            },
            icon: {
              url: true,
              width: true,
              height: true,
              alt: true,
            },
            showcase: {
              items: {
                _id: true,
                image: {
                  url: true,
                  width: true,
                  height: true,
                  alt: true,
                },
                video: {
                  url: true,
                  width: true,
                  height: true,
                  aspectRatio: true,
                  mimeType: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const projects = data.company.projects.projectList.items
  console.log(`  Found ${projects.length} projects`)

  let count = 0
  for (const proj of projects) {
    const slug = proj._slug || slugify(proj._title)

    // Cover image
    let cover = undefined
    if (proj.cover?.url) {
      cover = await downloadAndUploadImage(proj.cover.url, `${slug}-cover`)
    }

    // Icon
    let icon = undefined
    if (proj.icon?.url) {
      icon = await downloadAndUploadImage(proj.icon.url, `${slug}-icon`)
    }

    // Cover video (stored as object, not a file)
    let coverVideo = undefined
    if (proj.coverVideo?.url) {
      coverVideo = {
        url: proj.coverVideo.url,
        width: proj.coverVideo.width || undefined,
        height: proj.coverVideo.height || undefined,
        aspectRatio: proj.coverVideo.aspectRatio || undefined,
        mimeType: proj.coverVideo.mimeType || undefined,
      }
    }

    // Client reference
    const clientRef = proj.client?._slug
      ? {
          _type: 'reference' as const,
          _ref: `client-${proj.client._slug || slugify(proj.client._title)}`,
        }
      : undefined

    // Category references
    const categories = (proj.categories || [])
      .filter((c: { _slug?: string; _title?: string }) => c._title)
      .map((c: { _slug?: string; _title?: string }) => ({
        _key: slugify(c._title || ''),
        _type: 'reference' as const,
        _ref: `projectCategory-${c._slug || slugify(c._title || '')}`,
      }))

    // People references
    const people = (proj.people || [])
      .filter((p: { _title?: string }) => p._title)
      .map((p: { _slug?: string; _title?: string }) => ({
        _key: slugify(p._title || ''),
        _type: 'reference' as const,
        _ref: `person-${p._slug || slugify(p._title || '')}`,
      }))

    // Showcase items
    const showcaseItems = []
    for (const item of proj.showcase?.items || []) {
      let itemImage = undefined
      if (item.image?.url) {
        itemImage = await downloadAndUploadImage(
          item.image.url,
          `${slug}-showcase`
        )
      }

      let itemVideo = undefined
      if (item.video?.url) {
        itemVideo = {
          url: item.video.url,
          width: item.video.width || undefined,
          height: item.video.height || undefined,
          aspectRatio: item.video.aspectRatio || undefined,
          mimeType: item.video.mimeType || undefined,
        }
      }

      showcaseItems.push({
        _key: item._id || slugify(`${slug}-showcase-${showcaseItems.length}`),
        _type: 'showcaseItem',
        ...(itemImage ? { image: itemImage } : {}),
        ...(itemVideo ? { video: itemVideo } : {}),
      })
    }

    // Content rich text
    const content = await convertRichText(proj.content?.json?.content)

    // Determine caseStudy value
    const caseStudy =
      typeof proj.caseStudy === 'boolean'
        ? proj.caseStudy
        : proj.caseStudy
          ? true
          : false

    await sanityWriteClient.createOrReplace({
      _id: `project-${slug}`,
      _type: 'project',
      title: proj._title,
      slug: { _type: 'slug', current: slug },
      year: proj.year || undefined,
      projectWebsite: proj.projectWebsite || undefined,
      caseStudy,
      ...(clientRef ? { client: clientRef } : {}),
      ...(categories.length > 0 ? { categories } : {}),
      ...(people.length > 0 ? { people } : {}),
      ...(cover ? { cover } : {}),
      ...(coverVideo ? { coverVideo } : {}),
      ...(icon ? { icon } : {}),
      ...(showcaseItems.length > 0 ? { showcase: showcaseItems } : {}),
      ...(content.length > 0 ? { content } : {}),
    })
    count++
  }

  console.log(`  Created ${count} project documents`)
  return count
}

async function migrateShowcaseEntries() {
  console.log('  Fetching showcase entries...')

  const data = await basehubClient.query({
    pages: {
      showcase: {
        projectList: {
          items: {
            _id: true,
            project: {
              _slug: true,
            },
          },
        },
      },
    },
  })

  const entries = data.pages.showcase.projectList.items
  console.log(`  Found ${entries.length} showcase entries`)

  let count = 0
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry?.project?._slug) continue

    const projectSlug = entry.project._slug

    await sanityWriteClient.createOrReplace({
      _id: `showcaseEntry-${projectSlug}`,
      _type: 'showcaseEntry',
      project: {
        _type: 'reference' as const,
        _ref: `project-${projectSlug}`,
      },
      orderRank: String(i).padStart(4, '0'),
    })
    count++
  }

  console.log(`  Created ${count} showcase entry documents`)
  return count
}

export default async function migrateProjects_all() {
  const catCount = await migrateProjectCategories()
  const projCount = await migrateProjects()
  const showcaseCount = await migrateShowcaseEntries()
  console.log(
    `  Summary: ${catCount} categories, ${projCount} projects, ${showcaseCount} showcase entries migrated`
  )
}
