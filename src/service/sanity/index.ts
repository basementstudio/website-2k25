import { draftMode } from "next/headers"
import { createClient, type QueryParams } from "next-sanity"

import { dataset, projectId } from "../../../sanity/env"

const apiVersion = "2024-01-01"

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true
})

export async function sanityFetch<T>({
  query,
  params = {},
  tags = []
}: {
  query: string
  params?: QueryParams
  tags?: string[]
}): Promise<T> {
  let isDraftMode = false
  try {
    isDraftMode = (await draftMode()).isEnabled
  } catch {
    // Outside request scope (e.g. generateStaticParams at build time)
  }

  if (isDraftMode) {
    const token = process.env.SANITY_READ_TOKEN
    return client
      .withConfig({ useCdn: false, token, perspective: "previewDrafts" })
      .fetch<T>(query, params, {
        next: { revalidate: 0 }
      })
  }

  return client.fetch<T>(query, params, {
    next: { tags }
  })
}
