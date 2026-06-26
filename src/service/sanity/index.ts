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
 * Cached published read for prerenderable routes. Wraps the Live `sanityFetch`
 * in a `"use cache"` boundary so the route prerenders, while Sanity Live's
 * `cacheTag`s still drive on-demand revalidation when content changes. Use for
 * published page content; use plain `sanityFetch` only where draft/preview must
 * stay live, and `sanityFetchStatic` for build-time/`.md` contexts.
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
 * Non-Live Sanity fetch for contexts that run outside a `"use cache"` scope and
 * don't need live updates: `generateStaticParams`, `generateMetadata`, `.md`
 * endpoints, `sitemap`. The Live `sanityFetch` calls `cacheTag()` internally
 * (Cache Components), which is only valid inside `"use cache"`; this path skips
 * Live entirely and always reads published, stega-free data.
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
