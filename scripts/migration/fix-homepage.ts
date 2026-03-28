import 'dotenv/config'
import { nanoid } from 'nanoid'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { convertRichText, sanitizePortableText } from './utils/rich-text'

/**
 * Re-migrate the homepage singleton with valid project references.
 * The original migration failed because featuredProjects referenced
 * projects that didn't exist yet.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-homepage.ts
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

/**
 * Wrap a plain text string in a Sanity Portable Text block.
 */
function plainTextToPortableText(text: string) {
  if (!text) return []
  return [
    {
      _type: 'block' as const,
      _key: nanoid(12),
      style: 'normal',
      children: [
        {
          _type: 'span' as const,
          _key: nanoid(12),
          text,
          marks: [] as string[],
        },
      ],
      markDefs: [],
    },
  ]
}

export default async function fixHomepage() {
  console.log('=== Fix Homepage ===\n')

  // Pre-fetch existing projects for reference validation
  console.log('  Loading existing projects for reference validation...')
  const existingProjects = await fetchExistingIds('project')
  console.log(`  Projects: ${existingProjects.size}`)

  console.log('  Fetching homepage data from BaseHub...')

  const data = await basehubClient.query({
    pages: {
      homepage: {
        intro: {
          title: { json: { content: true } },
          subtitle: { json: { content: true } },
        },
        capabilities: {
          _title: true,
          intro: { json: { content: true } },
        },
        featuredProjects: {
          projectList: {
            items: {
              _title: true,
              project: {
                _slug: true,
              },
            },
          },
        },
      },
    },
    company: {
      projects: {
        projectCategories: {
          items: {
            _title: true,
            _slug: true,
            description: true,
          },
        },
      },
    },
  })

  const homepage = data.pages.homepage

  // Convert intro rich text
  const introTitleRaw = await convertRichText(
    homepage.intro?.title?.json?.content
  )
  const introTitle = sanitizePortableText(
    introTitleRaw as Array<Record<string, unknown>>,
    new Set(['block'])
  )

  const introSubtitleRaw = await convertRichText(
    homepage.intro?.subtitle?.json?.content
  )
  const introSubtitle = sanitizePortableText(
    introSubtitleRaw as Array<Record<string, unknown>>,
    new Set(['block'])
  )

  // Build capabilities from project categories
  const categories = data.company.projects.projectCategories.items || []
  const capabilities = (
    categories as Array<{ _title: string; _slug: string; description: string }>
  ).map((cat) => ({
    _key: nanoid(12),
    title: cat._title,
    ...(cat.description
      ? { description: plainTextToPortableText(cat.description) }
      : {}),
  }))

  // Featured project references — verify each exists
  let refsSkipped = 0
  const featuredProjects: Array<{
    _key: string
    _type: 'reference'
    _ref: string
  }> = []

  const projectItems = homepage.featuredProjects?.projectList?.items || []
  for (const item of projectItems) {
    const projectSlug = (item as { project?: { _slug?: string } }).project
      ?._slug
    if (!projectSlug) continue

    const projectId = `project-${projectSlug}`
    if (existingProjects.has(projectId)) {
      featuredProjects.push({
        _key: nanoid(12),
        _type: 'reference' as const,
        _ref: projectId,
      })
    } else {
      console.log(`    ⚠ Featured project ref skipped: ${projectId} not found`)
      refsSkipped++
    }
  }

  console.log(
    `  Featured projects: ${featuredProjects.length} valid, ${refsSkipped} skipped`
  )

  try {
    await sanityWriteClient.createOrReplace({
      _id: 'homepage',
      _type: 'homepage',
      title: 'Homepage',
      ...(introTitle.length > 0 ? { introTitle } : {}),
      ...(introSubtitle.length > 0 ? { introSubtitle } : {}),
      ...(capabilities.length > 0 ? { capabilities } : {}),
      ...(featuredProjects.length > 0 ? { featuredProjects } : {}),
    })
    console.log('  + homepage')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ! Failed homepage: ${msg}`)
    process.exit(1)
  }

  console.log('\n=== Summary ===')
  console.log('  Homepage created: 1')
  console.log(`  Featured projects: ${featuredProjects.length}`)
  console.log(`  Capabilities: ${capabilities.length}`)
  console.log(`  References skipped: ${refsSkipped}`)
  console.log('=== Done ===')
}

fixHomepage()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-homepage failed:', err)
    process.exit(1)
  })
