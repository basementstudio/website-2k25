import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'

/**
 * Dynamically discover and create person documents for former team members
 * who appear as blog post authors but are not in the current people directory.
 *
 * Queries BaseHub for ALL post authors, compares against existing Sanity
 * person documents, and creates any missing ones.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-missing-persons.ts
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface AuthorInfo {
  slug: string
  title: string
}

export default async function fixMissingPersons() {
  console.log('=== Fix Missing Persons ===\n')

  // Step 1: Fetch ALL post authors from BaseHub
  console.log('  Fetching all post authors from BaseHub...')
  const data = await basehubClient.query({
    pages: {
      blog: {
        posts: {
          items: {
            _title: true,
            authors: {
              _title: true,
              _slug: true,
            },
          },
        },
      },
    },
  })

  const posts = data.pages.blog.posts.items
  console.log(`  Found ${posts.length} blog posts`)

  // Step 2: Collect all unique authors from posts
  const authorMap = new Map<string, AuthorInfo>()
  for (const post of posts) {
    const authors = post.authors || []
    for (const author of authors) {
      if (!author._title) continue
      const slug = author._slug || slugify(author._title)
      const personId = `person-${slug}`
      if (!authorMap.has(personId)) {
        authorMap.set(personId, {
          slug,
          title: author._title,
        })
      }
    }
  }
  console.log(`  Found ${authorMap.size} unique authors across all posts`)

  // Step 3: Fetch all existing person documents from Sanity
  console.log('  Fetching existing person documents from Sanity...')
  const existingPersons: Array<{ _id: string }> =
    await sanityWriteClient.fetch('*[_type == "person"]{ _id }')
  const existingIds = new Set(existingPersons.map((p) => p._id))
  console.log(`  Found ${existingIds.size} existing person documents in Sanity`)

  // Step 4: Find missing persons (authors not in Sanity)
  const missing: Array<{ id: string; info: AuthorInfo }> = []
  for (const [personId, info] of authorMap) {
    if (!existingIds.has(personId)) {
      missing.push({ id: personId, info })
    }
  }

  if (missing.length === 0) {
    console.log('\n  All post authors already exist in Sanity. Nothing to do.')
    console.log('\n=== Done ===')
    return 0
  }

  console.log(`\n  Missing persons to create: ${missing.length}`)
  for (const m of missing) {
    console.log(`    - ${m.id} ("${m.info.title}")`)
  }

  // Step 5: Create missing person documents
  let created = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const { id, info } of missing) {
    try {
      await sanityWriteClient.createOrReplace({
        _id: id,
        _type: 'person',
        title: info.title,
      })
      console.log(`  + Created ${id} ("${info.title}")`)
      created++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed to create ${id}: ${msg}`)
      errors.push({ id, error: msg })
    }
  }

  console.log()
  console.log(`  Created: ${created}`)
  console.log(`  Already existed: ${authorMap.size - missing.length}`)

  if (errors.length > 0) {
    console.log(`  Failed: ${errors.length}`)
    for (const e of errors) {
      console.log(`    - ${e.id}: ${e.error}`)
    }
  }

  console.log('\n=== Done ===')
  return created
}

fixMissingPersons().catch((err) => {
  console.error('fix-missing-persons failed:', err)
  process.exit(1)
})
