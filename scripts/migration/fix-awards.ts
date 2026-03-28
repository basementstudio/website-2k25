import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'

/**
 * Re-migrate all awards with valid project references.
 * The original migration had 18 awards fail because they referenced
 * projects that didn't exist yet. Now that US-005 created all projects,
 * this script verifies references before including them.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-awards.ts
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

export default async function fixAwards() {
  console.log('=== Fix Awards ===\n')

  // Pre-fetch existing projects for reference validation
  console.log('  Loading existing projects for reference validation...')
  const existingProjects = await fetchExistingIds('project')
  console.log(`  Projects: ${existingProjects.size}`)

  console.log('  Fetching awards from BaseHub...')

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
  let refsSkipped = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const award of awards) {
    const slug = award._slug || slugify(award._title)
    const docId = `award-${slug}`
    try {
      // Download and upload certificate image
      let certificate = undefined
      if (award.certificate?.url) {
        try {
          const certRef = await downloadAndUploadImage(
            award.certificate.url,
            `${slug}-certificate`
          )
          if (certRef) certificate = certRef
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`    ⚠ Certificate upload failed for ${docId}: ${msg}`)
        }
      }

      // Build project reference — verify it exists
      let projectRef = undefined
      if (award.project?._slug) {
        const projectId = `project-${award.project._slug}`
        if (existingProjects.has(projectId)) {
          projectRef = {
            _type: 'reference' as const,
            _ref: projectId,
          }
        } else {
          console.log(`    ⚠ Project ref skipped for ${docId}: ${projectId} not found`)
          refsSkipped++
        }
      }

      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'award',
        title: award._title,
        date: award.date || undefined,
        awardUrl: award.awardUrl || undefined,
        ...(projectRef ? { project: projectRef } : {}),
        ...(certificate ? { certificate } : {}),
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
    console.log(`\n  ⚠ ${errors.length} awards failed:`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }

  console.log(`\n=== Summary ===`)
  console.log(`  Awards created: ${count}/${awards.length}`)
  console.log(`  Awards failed: ${errors.length}`)
  console.log(`  Project refs skipped: ${refsSkipped}`)
  console.log('=== Done ===')

  return { count, total: awards.length, errors: errors.length, refsSkipped }
}

fixAwards()
  .then((result) => {
    console.log(`\n${result.count}/${result.total} awards created.`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-awards failed:', err)
    process.exit(1)
  })
