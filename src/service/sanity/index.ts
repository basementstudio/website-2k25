import type { QueryParams } from "next-sanity"

import { client } from "./client"
import { liveSanityFetch } from "./live"

export { client }

export async function sanityFetch<T>({
  query,
  params = {},
  stega
}: {
  query: string
  params?: QueryParams
  /** Set to false to disable stega encoding (e.g. for asset URLs/IDs that must stay pristine). */
  stega?: boolean
}): Promise<T> {
  const { data } = await liveSanityFetch({ query, params, stega })
  return data as T
}
