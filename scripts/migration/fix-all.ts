import 'dotenv/config'
import { execSync } from 'child_process'
import { sanityWriteClient } from './sanity-client'
import { basehubClient } from './basehub-client'

/**
 * Orchestrator that runs all fix scripts in dependency order,
 * then runs verification to produce a final report.
 *
 * Dependency order:
 *   fix-clients → fix-missing-persons → fix-projects → fix-posts
 *   → fix-testimonials → fix-values → fix-awards → fix-homepage
 *
 * Run: pnpm exec tsx scripts/migration/fix-all.ts
 */

interface StepResult {
  name: string
  success: boolean
  durationMs: number
  error?: string
}

function runStep(name: string, scriptPath: string): StepResult {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`STEP: ${name}`)
  console.log(`${'='.repeat(60)}`)

  const start = Date.now()
  try {
    execSync(`pnpm exec tsx ${scriptPath}`, {
      stdio: 'inherit',
      timeout: 300000,
    })
    const durationMs = Date.now() - start
    console.log(`\n✓ ${name} completed in ${(durationMs / 1000).toFixed(1)}s`)
    return { name, success: true, durationMs }
  } catch (err) {
    const durationMs = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)
    console.error(
      `\n✗ ${name} failed after ${(durationMs / 1000).toFixed(1)}s`
    )
    return { name, success: false, durationMs, error }
  }
}

async function runVerification() {
  const documentTypes = [
    'department', 'client', 'person', 'project', 'projectCategory',
    'showcaseEntry', 'post', 'postCategory', 'openPosition',
    'award', 'testimonial', 'value', 'labProject',
    'homepage', 'servicesPage', 'peoplePage', 'careersPostPage', 'companyInfo',
  ]

  const singletonTypes = [
    'homepage', 'servicesPage', 'peoplePage', 'careersPostPage', 'companyInfo',
  ]

  // Fetch BaseHub expected counts
  const expectedCounts: Record<string, number> = {}
  try {
    const bhData = await basehubClient.query({
      company: {
        people: {
          peopleList: {
            items: { _id: true, department: { _title: true } },
          },
        },
        clients: { clientList: { items: { _id: true } } },
        projects: {
          projectList: { items: { _id: true } },
          projectCategories: { items: { _id: true } },
        },
        awards: { awardList: { items: { _id: true } } },
        testimonials: { services: { _id: true } },
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

    const deptNames = new Set<string>()
    for (const person of bhData.company.people.peopleList.items) {
      if (person.department?._title) deptNames.add(person.department._title)
    }
    expectedCounts['department'] = deptNames.size
    expectedCounts['client'] = bhData.company.clients.clientList.items.length
    expectedCounts['person'] = bhData.company.people.peopleList.items.length
    expectedCounts['project'] = bhData.company.projects.projectList.items.length
    expectedCounts['projectCategory'] =
      bhData.company.projects.projectCategories.items.length
    expectedCounts['showcaseEntry'] =
      bhData.pages.showcase.projectList.items.length
    expectedCounts['post'] = bhData.pages.blog.posts.items.length
    expectedCounts['postCategory'] =
      bhData.pages.blog.categories.items.length
    expectedCounts['openPosition'] =
      bhData.company.openPositions.openPositionsList.items.length
    expectedCounts['award'] = bhData.company.awards.awardList.items.length
    expectedCounts['testimonial'] = bhData.company.testimonials.services._id
      ? 1
      : 0
    expectedCounts['value'] = bhData.company.ourValues.valuesList.items.length
    expectedCounts['labProject'] =
      bhData.pages.laboratory.projectList.items.length
    for (const st of singletonTypes) expectedCounts[st] = 1
  } catch {
    console.warn('  Could not fetch BaseHub counts')
  }

  console.log('\nDocument counts (Sanity vs BaseHub expected):')
  console.log('─'.repeat(55))
  console.log(
    `  ${'Type'.padEnd(20)} ${'Sanity'.padStart(8)} ${'Expected'.padStart(10)} ${'Status'.padStart(8)}`
  )
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
      if (sanityCount >= expected) {
        status = '✓ match'
      } else if (sanityCount > 0) {
        status = '⚠ diff'
        totalMismatches++
      } else {
        status = '✗ empty'
        totalMismatches++
      }
    } else {
      status = sanityCount > 0 ? '✓' : '—'
    }

    const expectedStr = expected !== undefined ? String(expected) : '?'
    console.log(
      `  ${type.padEnd(20)} ${String(sanityCount).padStart(8)} ${expectedStr.padStart(10)} ${status.padStart(8)}`
    )
  }

  if (totalMismatches > 0) {
    console.log(`\n  ⚠ ${totalMismatches} type(s) with count issues`)
  } else {
    console.log('\n  ✓ All document counts match or exceed expected values')
  }

  // Check for broken references
  const brokenRefs = await sanityWriteClient.fetch<number>(
    `count(*[references(*[!defined(_type)]._id)])`
  )
  console.log(
    `\n  Broken references: ${brokenRefs === 0 ? '✓ none' : `⚠ ${brokenRefs}`}`
  )

  // Check missing required fields
  const missingTitle = await sanityWriteClient.fetch<number>(
    `count(*[_type in $types && !defined(title)])`,
    {
      types: [
        'client', 'person', 'project', 'post', 'postCategory',
        'projectCategory', 'award', 'value', 'testimonial',
      ],
    }
  )
  console.log(
    `  Missing required title: ${missingTitle === 0 ? '✓ none' : `⚠ ${missingTitle}`}`
  )

  return totalMismatches
}

async function fixAll() {
  console.log(
    '╔══════════════════════════════════════════════════════════╗'
  )
  console.log(
    '║              MIGRATION FIX-ALL ORCHESTRATOR             ║'
  )
  console.log(
    '╚══════════════════════════════════════════════════════════╝'
  )

  const totalStart = Date.now()
  const results: StepResult[] = []

  const steps = [
    { name: 'fix-clients', script: 'scripts/migration/fix-clients.ts' },
    {
      name: 'fix-missing-persons',
      script: 'scripts/migration/fix-missing-persons.ts',
    },
    { name: 'fix-projects', script: 'scripts/migration/fix-projects.ts' },
    { name: 'fix-posts', script: 'scripts/migration/fix-posts.ts' },
    {
      name: 'fix-testimonials',
      script: 'scripts/migration/fix-testimonials.ts',
    },
    { name: 'fix-values', script: 'scripts/migration/fix-values.ts' },
    { name: 'fix-awards', script: 'scripts/migration/fix-awards.ts' },
    { name: 'fix-homepage', script: 'scripts/migration/fix-homepage.ts' },
  ]

  for (const step of steps) {
    results.push(runStep(step.name, step.script))
  }

  // Verification
  console.log(`\n${'='.repeat(60)}`)
  console.log('VERIFICATION')
  console.log(`${'='.repeat(60)}`)

  await runVerification()

  // Final summary
  const totalDuration = Date.now() - totalStart
  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(
    '\n╔══════════════════════════════════════════════════════════╗'
  )
  console.log(
    '║                    FINAL SUMMARY                        ║'
  )
  console.log(
    '╚══════════════════════════════════════════════════════════╝'
  )
  console.log(`  Total time: ${(totalDuration / 1000).toFixed(1)}s`)
  console.log(`  Steps: ${succeeded} succeeded, ${failed} failed`)
  console.log()

  for (const r of results) {
    const icon = r.success ? '✓' : '✗'
    const time = `${(r.durationMs / 1000).toFixed(1)}s`
    console.log(
      `  ${icon} ${r.name.padEnd(25)} ${time}${r.error ? ' — error' : ''}`
    )
  }

  if (failed > 0) {
    console.log(`\n⚠ ${failed} step(s) failed. Check logs above.`)
  } else {
    console.log('\n✓ All migration fix steps completed successfully.')
  }
}

fixAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('fix-all orchestrator failed:', err)
    process.exit(1)
  })
