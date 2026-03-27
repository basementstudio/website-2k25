import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import { convertRichText } from './utils/rich-text'

/**
 * Fix and re-migrate all projects with valid client/people references,
 * plus all showcase entries with valid project references.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-projects.ts
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function fetchExistingIds(type: string): Promise<Set<string>> {
  const docs: Array<{ _id: string }> = await sanityWriteClient.fetch(
    `*[_type == "${type}"]{ _id }`
  )
  return new Set(docs.map((d) => d._id))
}

async function migrateProjectCategories() {
  console.log('\n--- Project Categories ---')
  console.log('  Fetching project categories from BaseHub...')

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
  const errors: Array<{ id: string; error: string }> = []

  for (const cat of categories) {
    const slug = cat._slug || slugify(cat._title)
    const docId = `projectCategory-${slug}`
    try {
      const subcategories = (cat.subCategories?.items || []).map(
        (sub: { _title: string }) => ({
          _key: slugify(sub._title),
          title: sub._title,
        })
      )

      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'projectCategory',
        title: cat._title,
        slug: { _type: 'slug', current: slug },
        description: cat.description || undefined,
        ...(subcategories.length > 0 ? { subcategories } : {}),
      })
      count++
      console.log(`  + ${docId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }
  console.log(`  Created ${count} project categories`)
  return count
}

async function migrateProjects(
  existingClients: Set<string>,
  existingPersons: Set<string>
) {
  console.log('\n--- Projects ---')
  console.log('  Fetching projects from BaseHub...')

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
  let refsSkipped = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const proj of projects) {
    const slug = proj._slug || slugify(proj._title)
    const docId = `project-${slug}`
    try {
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

      // Cover video
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

      // Client reference — verify exists
      let clientRef = undefined
      if (proj.client?._slug || proj.client?._title) {
        const clientSlug =
          proj.client._slug || slugify(proj.client._title)
        const clientId = `client-${clientSlug}`
        if (existingClients.has(clientId)) {
          clientRef = { _type: 'reference' as const, _ref: clientId }
        } else {
          console.log(`    ⚠ Client ref skipped for ${docId}: ${clientId} not found`)
          refsSkipped++
        }
      }

      // Category references
      const categories = (proj.categories || [])
        .filter((c: { _slug?: string; _title?: string }) => c._title)
        .map((c: { _slug?: string; _title?: string }) => ({
          _key: slugify(c._title || ''),
          _type: 'reference' as const,
          _ref: `projectCategory-${c._slug || slugify(c._title || '')}`,
        }))

      // People references — verify each exists
      const people: Array<{
        _key: string
        _type: 'reference'
        _ref: string
      }> = []
      for (const p of proj.people || []) {
        if (!p._title) continue
        const personSlug = p._slug || slugify(p._title)
        const personId = `person-${personSlug}`
        if (existingPersons.has(personId)) {
          people.push({
            _key: slugify(p._title),
            _type: 'reference' as const,
            _ref: personId,
          })
        } else {
          console.log(
            `    ⚠ Person ref skipped for ${docId}: ${personId} not found`
          )
          refsSkipped++
        }
      }

      // Showcase items
      const showcaseItems = []
      for (const item of proj.showcase?.items || []) {
        let itemImage = undefined
        if (item.image?.url) {
          itemImage = await downloadAndUploadImage(
            item.image.url,
            `${slug}-showcase-${showcaseItems.length}`
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
          _key:
            item._id || slugify(`${slug}-showcase-${showcaseItems.length}`),
          _type: 'showcaseItem',
          ...(itemImage ? { image: itemImage } : {}),
          ...(itemVideo ? { video: itemVideo } : {}),
        })
      }

      // Content rich text
      const content = await convertRichText(proj.content?.json?.content)

      // Case study
      const caseStudy =
        typeof proj.caseStudy === 'boolean'
          ? proj.caseStudy
          : proj.caseStudy
            ? true
            : false

      await sanityWriteClient.createOrReplace({
        _id: docId,
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
      console.log(`  + ${docId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }
  console.log(`  Created ${count} projects, ${refsSkipped} references skipped`)
  return { count, refsSkipped }
}

async function migrateShowcaseEntries(existingProjects: Set<string>) {
  console.log('\n--- Showcase Entries ---')
  console.log('  Fetching showcase entries from BaseHub...')

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
  let skipped = 0
  const errors: Array<{ id: string; error: string }> = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry?.project?._slug) continue

    const projectSlug = entry.project._slug
    const projectId = `project-${projectSlug}`
    const docId = `showcaseEntry-${projectSlug}`

    // Verify project reference exists
    if (!existingProjects.has(projectId)) {
      console.log(`  ⚠ Skipped ${docId}: project ${projectId} not found`)
      skipped++
      continue
    }

    try {
      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'showcaseEntry',
        project: {
          _type: 'reference' as const,
          _ref: projectId,
        },
        orderRank: String(i).padStart(4, '0'),
      })
      count++
      console.log(`  + ${docId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }
  console.log(`  Created ${count} showcase entries, ${skipped} skipped`)
  return { count, skipped }
}

export default async function fixProjects() {
  console.log('=== Fix Projects ===\n')

  // Pre-fetch existing documents for reference validation
  console.log('  Loading existing documents for reference validation...')
  const [existingClients, existingPersons] = await Promise.all([
    fetchExistingIds('client'),
    fetchExistingIds('person'),
  ])
  console.log(`  Clients: ${existingClients.size}, Persons: ${existingPersons.size}`)

  // Step 1: Project categories (ensure slugs are set)
  const catCount = await migrateProjectCategories()

  // Step 2: Projects (with validated references)
  const { count: projCount, refsSkipped } = await migrateProjects(
    existingClients,
    existingPersons
  )

  // Step 3: Refresh project IDs after creation, then create showcase entries
  const existingProjects = await fetchExistingIds('project')
  const { count: showcaseCount, skipped: showcaseSkipped } =
    await migrateShowcaseEntries(existingProjects)

  // Summary
  console.log('\n=== Summary ===')
  console.log(`  Project categories: ${catCount}`)
  console.log(`  Projects created: ${projCount}`)
  console.log(`  Showcase entries created: ${showcaseCount}`)
  console.log(`  References skipped: ${refsSkipped}`)
  console.log(`  Showcase entries skipped: ${showcaseSkipped}`)
  console.log('=== Done ===')

  return { catCount, projCount, showcaseCount, refsSkipped, showcaseSkipped }
}

fixProjects()
  .then((result) => {
    console.log(
      `\n${result.projCount} projects, ${result.showcaseCount} showcase entries created.`
    )
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-projects failed:', err)
    process.exit(1)
  })
