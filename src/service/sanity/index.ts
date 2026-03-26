import { createClient, type QueryParams } from "next-sanity"

import { dataset, projectId } from "../../../sanity/env"

const apiVersion = "2024-01-01"

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
}: {
  query: string
  params?: QueryParams
  tags?: string[]
}): Promise<T> {
  return client.fetch<T>(query, params, {
    next: { tags },
  })
}
