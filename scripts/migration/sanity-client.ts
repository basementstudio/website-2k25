import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable. Check .env.local'
  )
}

if (!dataset) {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_DATASET environment variable. Check .env.local'
  )
}

if (!token) {
  throw new Error(
    'Missing SANITY_API_TOKEN environment variable. Create a write token in the Sanity dashboard and add it to .env.local'
  )
}

export const sanityWriteClient = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})
