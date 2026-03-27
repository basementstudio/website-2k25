import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { basehubClient } from './basehub-client'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const DATA_DIR = path.resolve('scripts/migration/data')
const EXPORT_FILE = path.join(DATA_DIR, 'production-export.tar.gz')
const EXTRACT_DIR = path.join(DATA_DIR, 'extracted')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SanityDocument {
  _id: string
  _type: string
  _rev?: string
  title?: string
  name?: string
  slug?: { _type: string; current: string }
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Constants — document types we migrated
// ---------------------------------------------------------------------------
const DOCUMENT_TYPES = [
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

const SINGLETON_TYPES = [
  'homepage',
  'servicesPage',
  'peoplePage',
  'careersPostPage',
  'companyInfo',
  'threeDAssets',
]

/** Types that require a `title` field */
const TITLE_REQUIRED_TYPES = [
  'award',
  'client',
  'department',
  'labProject',
  'openPosition',
  'person',
  'post',
  'postCategory',
  'project',
  'projectCategory',
  'value',
]

/** Types that require a `slug` field */
const SLUG_REQUIRED_TYPES = [
  'post',
  'postCategory',
  'project',
  'projectCategory',
  'openPosition',
]

/** Portable-text fields per document type (should have content) */
const PT_FIELDS: Record<string, string[]> = {
  post: ['intro', 'content'],
  project: ['content'],
  value: ['description'],
  openPosition: ['jobDescription'],
  homepage: ['introTitle', 'introSubtitle'],
  companyInfo: ['newsletter'],
  peoplePage: ['subheading1', 'subheading2', 'preOpenPositionsText'],
  servicesPage: ['intro'],
}

// ---------------------------------------------------------------------------
// 1. Extract & parse NDJSON
// ---------------------------------------------------------------------------
function extractAndParse(): SanityDocument[] {
  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(
      `Export file not found at ${EXPORT_FILE}.\nRun:\n  npx sanity@latest dataset export production ${EXPORT_FILE}`
    )
    process.exit(1)
  }

  // Create extraction directory
  if (fs.existsSync(EXTRACT_DIR)) {
    fs.rmSync(EXTRACT_DIR, { recursive: true })
  }
  fs.mkdirSync(EXTRACT_DIR, { recursive: true })

  console.log('Extracting export archive...')
  execSync(`tar xzf "${EXPORT_FILE}" -C "${EXTRACT_DIR}"`)

  // Sanity export wraps files in a timestamped subdirectory — find data.ndjson
  let ndjsonFile = path.join(EXTRACT_DIR, 'data.ndjson')
  if (!fs.existsSync(ndjsonFile)) {
    // Look inside subdirectories
    const entries = fs.readdirSync(EXTRACT_DIR)
    for (const entry of entries) {
      const candidate = path.join(EXTRACT_DIR, entry, 'data.ndjson')
      if (fs.existsSync(candidate)) {
        ndjsonFile = candidate
        break
      }
    }
  }
  if (!fs.existsSync(ndjsonFile)) {
    console.error(
      `Expected data.ndjson in export but not found under ${EXTRACT_DIR}`
    )
    process.exit(1)
  }

  const content = fs.readFileSync(ndjsonFile, 'utf-8')
  const documents: SanityDocument[] = []

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      documents.push(JSON.parse(trimmed) as SanityDocument)
    } catch {
      // skip malformed lines
    }
  }

  return documents
}

// ---------------------------------------------------------------------------
// 2. Count documents by _type
// ---------------------------------------------------------------------------
function countByType(docs: SanityDocument[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const doc of docs) {
    counts[doc._type] = (counts[doc._type] ?? 0) + 1
  }
  return counts
}

// ---------------------------------------------------------------------------
// 3. Fetch expected counts from BaseHub
// ---------------------------------------------------------------------------
async function fetchBaseHubCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  try {
    const data = await basehubClient.query({
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

    // Departments are deduplicated from people
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
    counts['projectCategory'] =
      data.company.projects.projectCategories.items.length
    counts['showcaseEntry'] = data.pages.showcase.projectList.items.length
    counts['post'] = data.pages.blog.posts.items.length
    counts['postCategory'] = data.pages.blog.categories.items.length
    counts['openPosition'] =
      data.company.openPositions.openPositionsList.items.length
    counts['award'] = data.company.awards.awardList.items.length
    // Single testimonial at company.testimonials.services
    counts['testimonial'] = data.company.testimonials.services._id ? 1 : 0
    counts['value'] = data.company.ourValues.valuesList.items.length
    counts['labProject'] = data.pages.laboratory.projectList.items.length

    // Singletons — always 1
    for (const st of SINGLETON_TYPES) {
      counts[st] = 1
    }
  } catch (error) {
    console.error(
      '  Warning: Could not fetch BaseHub counts:',
      error instanceof Error ? error.message : error
    )
  }

  return counts
}

// ---------------------------------------------------------------------------
// 4. Missing required fields
// ---------------------------------------------------------------------------
function findMissingRequiredFields(
  docs: SanityDocument[]
): Array<{ _id: string; _type: string; missing: string[] }> {
  const results: Array<{ _id: string; _type: string; missing: string[] }> = []

  for (const doc of docs) {
    const missing: string[] = []

    if (TITLE_REQUIRED_TYPES.includes(doc._type) && !doc.title) {
      missing.push('title')
    }

    // testimonial uses `name` instead of `title`
    if (doc._type === 'testimonial' && !doc.name) {
      missing.push('name')
    }

    if (SLUG_REQUIRED_TYPES.includes(doc._type)) {
      const slug = doc.slug as { current?: string } | undefined
      if (!slug?.current) missing.push('slug')
    }

    if (!doc._type) missing.push('_type')

    if (missing.length > 0) {
      results.push({ _id: doc._id, _type: doc._type, missing })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// 5. Broken references
// ---------------------------------------------------------------------------
function collectRefs(obj: unknown): string[] {
  if (obj === null || obj === undefined || typeof obj !== 'object') return []

  if (Array.isArray(obj)) {
    const refs: string[] = []
    for (const item of obj) refs.push(...collectRefs(item))
    return refs
  }

  const record = obj as Record<string, unknown>
  const refs: string[] = []

  if (typeof record._ref === 'string') {
    refs.push(record._ref)
  }

  for (const value of Object.values(record)) {
    refs.push(...collectRefs(value))
  }

  return refs
}

function findBrokenReferences(
  allDocs: SanityDocument[]
): Array<{ _id: string; _type: string; brokenRef: string }> {
  // Build set of all known IDs (including draft variants)
  const allIds = new Set<string>()
  for (const doc of allDocs) {
    allIds.add(doc._id)
    if (doc._id.startsWith('drafts.')) {
      allIds.add(doc._id.slice(7))
    }
  }

  const results: Array<{ _id: string; _type: string; brokenRef: string }> = []

  for (const doc of allDocs) {
    // Skip system documents
    if (doc._type.startsWith('sanity.') || doc._type.startsWith('system.'))
      continue

    const refs = collectRefs(doc)
    for (const ref of refs) {
      if (!allIds.has(ref) && !allIds.has(`drafts.${ref}`)) {
        results.push({ _id: doc._id, _type: doc._type, brokenRef: ref })
      }
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// 6. Empty portable-text fields
// ---------------------------------------------------------------------------
function isEmptyPortableText(value: unknown): boolean {
  if (!value) return true
  if (!Array.isArray(value)) return false
  if (value.length === 0) return true

  return value.every((block: unknown) => {
    if (typeof block !== 'object' || block === null) return true
    const b = block as Record<string, unknown>
    if (b._type !== 'block') return false // non-block types count as content
    const children = b.children as Array<Record<string, unknown>> | undefined
    if (!children || children.length === 0) return true
    return children.every(
      (child) =>
        !child.text ||
        (typeof child.text === 'string' && child.text.trim() === '')
    )
  })
}

function findEmptyPortableText(
  docs: SanityDocument[]
): Array<{ _id: string; _type: string; field: string }> {
  const results: Array<{ _id: string; _type: string; field: string }> = []

  for (const doc of docs) {
    const fields = PT_FIELDS[doc._type]
    if (!fields) continue

    for (const field of fields) {
      if (isEmptyPortableText(doc[field])) {
        results.push({ _id: doc._id, _type: doc._type, field })
      }
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Main audit
// ---------------------------------------------------------------------------
async function audit() {
  console.log('=== Sanity Dataset Audit ===\n')

  // Extract & parse
  const allDocs = extractAndParse()
  const migrationDocs = allDocs.filter((d) =>
    DOCUMENT_TYPES.includes(d._type)
  )
  console.log(
    `Parsed ${allDocs.length} total documents (${migrationDocs.length} migration-relevant)\n`
  )

  // Count by type
  const typeCounts = countByType(migrationDocs)

  // Fetch BaseHub expected counts
  console.log('Fetching expected counts from BaseHub...')
  const expectedCounts = await fetchBaseHubCounts()
  console.log()

  // ── Summary table ──
  console.log('type                |   actual |  expected |  missing | status')
  console.log('─'.repeat(68))

  for (const type of DOCUMENT_TYPES) {
    const actual = typeCounts[type] ?? 0
    const expected = expectedCounts[type]
    const expectedStr = expected !== undefined ? String(expected) : '?'
    const missingNum =
      expected !== undefined ? Math.max(0, expected - actual) : 0
    const missingStr = expected !== undefined ? String(missingNum) : '?'

    let status: string
    if (expected !== undefined) {
      if (actual >= expected) status = '✓ match'
      else if (actual > 0) status = '⚠ diff'
      else status = '✗ empty'
    } else {
      status = actual > 0 ? '✓' : '✗ empty'
    }

    console.log(
      `${type.padEnd(20)}| ${String(actual).padStart(8)} | ${expectedStr.padStart(9)} | ${missingStr.padStart(8)} | ${status}`
    )
  }

  // ── Missing required fields ──
  console.log('\n── Missing Required Fields ──')
  const missingFields = findMissingRequiredFields(migrationDocs)
  if (missingFields.length === 0) {
    console.log('  ✓ No documents missing required fields (title, slug, _type)')
  } else {
    for (const item of missingFields) {
      console.log(
        `  ✗ ${item._type} (${item._id}): missing ${item.missing.join(', ')}`
      )
    }
    console.log(`  Total: ${missingFields.length} document(s) with missing fields`)
  }

  // ── Broken references ──
  console.log('\n── Broken References ──')
  const brokenRefs = findBrokenReferences(allDocs)
  if (brokenRefs.length === 0) {
    console.log('  ✓ No broken references')
  } else {
    // Group by type for readability
    const byType: Record<string, typeof brokenRefs> = {}
    for (const item of brokenRefs) {
      ;(byType[item._type] ??= []).push(item)
    }
    for (const [type, items] of Object.entries(byType)) {
      console.log(`  ${type}:`)
      for (const item of items) {
        console.log(`    ✗ ${item._id} → ${item.brokenRef}`)
      }
    }
    console.log(`\n  Total: ${brokenRefs.length} broken reference(s)`)
  }

  // ── Empty portable text ──
  console.log('\n── Empty Portable Text Fields ──')
  const emptyPt = findEmptyPortableText(migrationDocs)
  if (emptyPt.length === 0) {
    console.log(
      '  ✓ No empty portable text fields that should have content'
    )
  } else {
    for (const item of emptyPt) {
      console.log(`  ⚠ ${item._type} (${item._id}): ${item.field} is empty`)
    }
    console.log(`\n  Total: ${emptyPt.length} empty portable text field(s)`)
  }

  console.log('\n=== Audit Complete ===')
}

audit().catch((error) => {
  console.error('Audit failed:', error)
  process.exit(1)
})
