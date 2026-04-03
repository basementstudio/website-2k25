import 'dotenv/config'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { sanityWriteClient } from './sanity-client'

interface ShowcaseEntryDoc {
  _id: string
  _type: string
  orderRank: string | null
  project: { _ref: string } | null
}

async function migrateShowcaseToSingleton() {
  console.log('Fetching existing showcaseEntry documents...')

  const entries = await sanityWriteClient.fetch<ShowcaseEntryDoc[]>(
    `*[_type == "showcaseEntry"] | order(orderRank asc) { _id, _type, orderRank, project }`
  )

  console.log(`Found ${entries.length} showcaseEntry documents`)

  if (entries.length === 0) {
    console.log('No showcaseEntry documents found. Creating empty showcasePage singleton.')
  }

  // Build projects array from entries that have a valid project reference
  const projects = entries
    .filter((entry) => entry.project?._ref)
    .map((entry, index) => ({
      _key: `project-${index}`,
      _type: 'reference' as const,
      _ref: entry.project!._ref,
    }))

  console.log(`Creating showcasePage singleton with ${projects.length} project references...`)

  // Create the showcasePage singleton document
  await sanityWriteClient.createOrReplace({
    _id: 'showcasePage',
    _type: 'showcasePage',
    title: 'Showcase',
    projects,
  })

  console.log('showcasePage singleton created successfully')

  // Delete old showcaseEntry documents
  if (entries.length > 0) {
    console.log(`Deleting ${entries.length} old showcaseEntry documents...`)

    const transaction = sanityWriteClient.transaction()
    for (const entry of entries) {
      transaction.delete(entry._id)
    }
    await transaction.commit()

    console.log('Old showcaseEntry documents deleted')
  }

  console.log('Migration complete!')
}

migrateShowcaseToSingleton().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
