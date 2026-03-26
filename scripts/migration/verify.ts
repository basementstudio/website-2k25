import 'dotenv/config'
import { sanityWriteClient } from './sanity-client'
import { basehubClient } from './basehub-client'

/**
 * Verification script — queries Sanity for document counts per type,
 * compares against BaseHub expected totals, checks for missing required
 * fields, and verifies image assets resolve.
 */

const documentTypes = [
  'department',
  'client',
  'person',
  'project',
  'projectCategory',
  'showcaseEntry',
  'post',
  'postCategory',
  'openPosition',
  'award',
  'testimonial',
  'value',
  'labProject',
  'homepage',
  'servicesPage',
  'peoplePage',
  'careersPostPage',
  'companyInfo',
  'threeDAssets',
]

const singletonTypes = [
  'homepage',
  'servicesPage',
  'peoplePage',
  'careersPostPage',
  'companyInfo',
  'threeDAssets',
]

async function fetchBaseHubCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  try {
    const data = await basehubClient.query({
      company: {
        people: { peopleList: { items: { _id: true, department: { _title: true } } } },
        clients: { clientList: { items: { _id: true } } },
        projects: {
          projectList: { items: { _id: true } },
          projectCategories: { items: { _id: true } },
        },
        awards: { awardList: { items: { _id: true } } },
        testimonials: { items: { _id: true } },
        ourValues: { valuesList: { items: { _id: true } } },
        openPositions: { openPositionsList: { items: { _id: true } } },
      },
      pages: {
        blog: {
          posts: { items: { _id: true } },
          categories: { items: { _id: true } },
        },
        showcase: { projectList: { items: { _id: true } } },
        laboratory: { projectList: { items: { _id: true } } },
      },
    })

    // Extract department count from people (deduplicated)
    const deptNames = new Set<string>()
    for (const person of data.company.people.peopleList.items) {
      if (person.department?._title) {
        deptNames.add(person.department._title)
      }
    }
    counts['department'] = deptNames.size
    counts['client'] = data.company.clients.clientList.items.length
    counts['person'] = data.company.people.peopleList.items.length
    counts['project'] = data.company.projects.projectList.items.length
    counts['projectCategory'] = data.company.projects.projectCategories.items.length
    counts['showcaseEntry'] = data.pages.showcase.projectList.items.length
    counts['post'] = data.pages.blog.posts.items.length
    counts['postCategory'] = data.pages.blog.categories.items.length
    counts['openPosition'] = data.company.openPositions.openPositionsList.items.length
    counts['award'] = data.company.awards.awardList.items.length
    counts['testimonial'] = data.company.testimonials.items.length
    counts['value'] = data.company.ourValues.valuesList.items.length
    counts['labProject'] = data.pages.laboratory.projectList.items.length

    // Singletons are always 1 if they exist in BaseHub
    for (const st of singletonTypes) {
      counts[st] = 1
    }
  } catch (error) {
    console.error('  ⚠ Could not fetch BaseHub counts for comparison:', error)
  }

  return counts
}

async function checkImageAssets() {
  // Fetch a sample of image asset URLs from Sanity
  const images = await sanityWriteClient.fetch<Array<{ _id: string; url: string }>>(
    `*[_type == "sanity.imageAsset"][0...10]{ _id, url }`
  )

  if (images.length === 0) {
    console.log('  No image assets found in Sanity')
    return { checked: 0, resolved: 0, failed: 0 }
  }

  let resolved = 0
  let failed = 0

  for (const image of images) {
    try {
      const response = await fetch(image.url, { method: 'HEAD' })
      if (response.ok) {
        resolved++
      } else {
        failed++
        console.log(`  ✗ Asset ${image._id}: HTTP ${response.status}`)
      }
    } catch {
      failed++
      console.log(`  ✗ Asset ${image._id}: network error`)
    }
  }

  return { checked: images.length, resolved, failed }
}

async function verify() {
  console.log('=== Sanity Migration Verification ===\n')

  // Step 1: Fetch expected counts from BaseHub
  console.log('Fetching expected counts from BaseHub...')
  const expectedCounts = await fetchBaseHubCounts()
  console.log()

  // Step 2: Count documents per type in Sanity and compare
  console.log('Document counts (Sanity vs BaseHub expected):')
  console.log('─'.repeat(55))
  console.log(`  ${'Type'.padEnd(20)} ${'Sanity'.padStart(8)} ${'Expected'.padStart(10)} ${'Status'.padStart(8)}`)
  console.log('─'.repeat(55))

  let totalMismatches = 0

  for (const type of documentTypes) {
    const sanityCount = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type])`,
      { type }
    )
    const expected = expectedCounts[type]
    let status: string
    if (expected !== undefined) {
      if (sanityCount === expected) {
        status = '✓ match'
      } else if (sanityCount > 0) {
        status = '⚠ diff'
        totalMismatches++
      } else {
        status = '✗ empty'
        totalMismatches++
      }
    } else {
      status = sanityCount > 0 ? '✓' : '✗ empty'
      if (sanityCount === 0) totalMismatches++
    }

    const expectedStr = expected !== undefined ? String(expected) : '?'
    console.log(`  ${type.padEnd(20)} ${String(sanityCount).padStart(8)} ${expectedStr.padStart(10)} ${status.padStart(8)}`)
  }

  console.log()
  if (totalMismatches > 0) {
    console.log(`  ⚠ ${totalMismatches} type(s) with count mismatches or empty`)
  } else {
    console.log('  ✓ All document counts match expected values')
  }
  console.log()

  // Step 3: Check for documents missing required fields
  console.log('Missing required fields:')
  console.log('─'.repeat(55))

  const missingTitle = await sanityWriteClient.fetch<number>(
    `count(*[defined(_type) && !(_type in $singletonTypes) && !(_type match "sanity.*") && !defined(title)])`,
    { singletonTypes }
  )
  console.log(`  Documents missing title: ${missingTitle}`)

  const slugTypes = [
    'post',
    'postCategory',
    'project',
    'projectCategory',
    'openPosition',
  ]
  let missingSlugTotal = 0
  for (const type of slugTypes) {
    const missingSlug = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type && !defined(slug.current)])`,
      { type }
    )
    if (missingSlug > 0) {
      console.log(`  ⚠ ${type}: ${missingSlug} document(s) missing slug`)
      missingSlugTotal += missingSlug
    }
  }
  if (missingSlugTotal === 0) {
    console.log('  ✓ No documents missing slug')
  }
  console.log()

  // Step 4: Check that image assets resolve
  console.log('Image asset verification (sample of 10):')
  console.log('─'.repeat(55))

  const assetResult = await checkImageAssets()
  console.log(`  Checked: ${assetResult.checked}, Resolved: ${assetResult.resolved}, Failed: ${assetResult.failed}`)
  if (assetResult.failed === 0 && assetResult.checked > 0) {
    console.log('  ✓ All sampled image assets resolve')
  } else if (assetResult.failed > 0) {
    console.log('  ⚠ Some image assets failed to resolve')
  }

  console.log('\n=== Verification Complete ===')
}

verify().catch((error) => {
  console.error('Verification failed:', error)
  process.exit(1)
})
