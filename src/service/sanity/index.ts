import type { QueryParams } from "next-sanity"

import { client } from "./client"
import { liveSanityFetch } from "./live"

export { client }

type Perspective = "published" | "drafts"

export async function sanityFetch<T>({
  query,
  params = {},
  stega,
  perspective
}: {
  query: string
  params?: QueryParams
  /** Disable stega encoding (use in generateMetadata, generateStaticParams, and for asset URLs/IDs). */
  stega?: boolean
  /** Override the perspective. Pass "published" in generateStaticParams / generateMetadata. */
  perspective?: Perspective
}): Promise<T> {
  const { data } = await liveSanityFetch({
    query,
    params,
    stega,
    perspective
  })
  return data as T
}

/**
 * Cached published read: Live `sanityFetch` inside `"use cache"` so the route
 * prerenders while Sanity Live's `cacheTag`s still drive revalidation. Use for
 * published page content (plain `sanityFetch` is for live draft/preview).
 */
export async function sanityFetchCached<T>(opts: {
  query: string
  params?: QueryParams
  perspective?: Perspective
}): Promise<T> {
  "use cache"
  return sanityFetch<T>(opts)
}

/**
 * Non-Live fetch for contexts outside a `"use cache"` scope (`generateStaticParams`,
 * `generateMetadata`): the Live `sanityFetch`'s `cacheTag()` is illegal there.
 * Always reads published, stega-free data.
 */
export async function sanityFetchStatic<T>({
  query,
  params = {},
  perspective = "published"
}: {
  query: string
  params?: QueryParams
  perspective?: Perspective
}): Promise<T> {
  return client.fetch<T>(query, params, { perspective, stega: false })
}
