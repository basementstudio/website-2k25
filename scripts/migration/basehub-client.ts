import 'dotenv/config'
// @ts-expect-error — basehub canary SDK types don't resolve (known pre-existing issue)
import { basehub } from 'basehub'

// Ensure BASEHUB_TOKEN is available
if (!process.env.BASEHUB_TOKEN) {
  throw new Error(
    'Missing BASEHUB_TOKEN environment variable. Check .env.local'
  )
}

// Initialize BaseHub client — reads BASEHUB_TOKEN from process.env automatically
const client = basehub()

/**
 * Query BaseHub using the generated SDK's fluent query builder.
 * Usage: const data = await queryBaseHub((q) => q.query({ ... }))
 */
export async function queryBaseHub<T>(
  queryFn: (client: ReturnType<typeof basehub>) => Promise<T>
): Promise<T> {
  return queryFn(client)
}

export { client as basehubClient }
