import 'dotenv/config'
import { sanityWriteClient } from './sanity-client'

/**
 * Verification script — queries Sanity for document counts per type
 * and checks for common data issues.
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

async function verify() {
  console.log('=== Sanity Migration Verification ===\n')

  // Count documents per type
  console.log('Document counts:')
  console.log('─'.repeat(40))

  for (const type of documentTypes) {
    const count = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type])`,
      { type }
    )
    const status = count > 0 ? '✓' : '✗'
    console.log(`  ${status} ${type.padEnd(20)} ${count}`)
  }

  console.log()

  // Check for documents missing required fields
  console.log('Missing required fields:')
  console.log('─'.repeat(40))

  const missingTitle = await sanityWriteClient.fetch<number>(
    `count(*[defined(_type) && !(_type in ["homepage", "servicesPage", "peoplePage", "careersPostPage", "companyInfo", "threeDAssets"]) && !defined(title)])`
  )
  console.log(`  Documents missing title: ${missingTitle}`)

  const slugTypes = [
    'post',
    'postCategory',
    'project',
    'projectCategory',
    'openPosition',
  ]
  for (const type of slugTypes) {
    const missingSlug = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type && !defined(slug.current)])`,
      { type }
    )
    if (missingSlug > 0) {
      console.log(`  ⚠ ${type}: ${missingSlug} document(s) missing slug`)
    }
  }

  console.log('\n=== Verification Complete ===')
}

verify().catch((error) => {
  console.error('Verification failed:', error)
  process.exit(1)
})
